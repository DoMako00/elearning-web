/**
 * GreenLearn Service Worker - Offline Caching & Background Sync
 * Handles course asset caching, offline queue, and background synchronization
 */

/// <reference lib="webworker" />

import type {
  SyncQueueItem,
  SyncQueueConfig,
  SyncStatus,
  SyncError,
  CacheStrategy,
  OfflineAssetManifest,
  SyncQueueInboundMessage,
  SyncQueueOutboundMessage,
} from '../src/shared/types/workers';

/* ════════════════════════════════════════════════════════════════════
   CONFIGURATION
════════════════════════════════════════════════════════════════════ */

const SW_VERSION = '1.2.0';
const CACHE_NAME = `greenlearn-v${SW_VERSION}`;
const OFFLINE_CACHE_NAME = `greenlearn-offline-v${SW_VERSION}`;
const SYNC_QUEUE_STORE = 'sync-queue';
const SYNC_QUEUE_DB = 'greenlearn-sync-db';

const SYNC_CONFIG: SyncQueueConfig = {
  dbName: SYNC_QUEUE_DB,
  storeName: SYNC_QUEUE_STORE,
  maxQueueSize: 500,
  retryDelayMs: 5000,
  maxRetries: 3,
  batchSize: 10,
  flushIntervalMs: 30000,
};

const CACHE_STRATEGIES: CacheStrategy[] = [
  {
    name: 'documents',
    patterns: [/\.(pdf|pptx|docx|csv)$/i, /\/api\/resources\//],
    strategy: 'cache-first',
    maxAgeSeconds: 60 * 60 * 24 * 30,
    maxEntries: 100,
  },
  {
    name: 'images',
    patterns: [/\.(png|jpg|jpeg|webp|svg|gif)$/i, /\/Assets\//],
    strategy: 'cache-first',
    maxAgeSeconds: 60 * 60 * 24 * 7,
    maxEntries: 200,
  },
  {
    name: 'api-responses',
    patterns: [/\/api\/lessons\//, /\/api\/courses\//, /\/api\/progress\//],
    strategy: 'stale-while-revalidate',
    maxAgeSeconds: 60 * 5,
    maxEntries: 50,
  },
  {
    name: 'static-assets',
    patterns: [/\.(js|css|woff2?)$/i],
    strategy: 'cache-first',
    maxAgeSeconds: 60 * 60 * 24 * 365,
    maxEntries: 100,
  },
];

/* ════════════════════════════════════════════════════════════════════
   INDEXEDDB HELPERS
════════════════════════════════════════════════════════════════════ */

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SYNC_CONFIG.dbName, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(SYNC_CONFIG.storeName)) {
        const store = db.createObjectStore(SYNC_CONFIG.storeName, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('priority', 'priority', { unique: false });
        store.createIndex('operation', 'operation', { unique: false });
      }
    };
  });
}

async function queuePush(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
  const db = await openDB();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const queueItem: SyncQueueItem = {
    ...item,
    id,
    timestamp: Date.now(),
    retryCount: 0,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_CONFIG.storeName, 'readwrite');
    const store = tx.objectStore(SYNC_CONFIG.storeName);
    const request = store.add(queueItem);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

async function queueGetAll(): Promise<SyncQueueItem[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_CONFIG.storeName, 'readonly');
    const store = tx.objectStore(SYNC_CONFIG.storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function queueRemove(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_CONFIG.storeName, 'readwrite');
    const store = tx.objectStore(SYNC_CONFIG.storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function queueUpdate(item: SyncQueueItem): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_CONFIG.storeName, 'readwrite');
    const store = tx.objectStore(SYNC_CONFIG.storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function queueClear(ids?: string[]): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_CONFIG.storeName, 'readwrite');
    const store = tx.objectStore(SYNC_CONFIG.storeName);

    if (ids && ids.length > 0) {
      let completed = 0;
      const total = ids.length;
      for (const id of ids) {
        const request = store.delete(id);
        request.onsuccess = () => {
          completed++;
          if (completed === total) resolve();
        };
        request.onerror = () => reject(request.error);
      }
    } else {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    }
  });
}

/* ════════════════════════════════════════════════════════════════════
   SYNC PROCESSING
════════════════════════════════════════════════════════════════════ */

async function processSyncQueue(): Promise<{ processed: number; failed: number }> {
  const items = await queueGetAll();
  const pending = items
    .filter(i => i.retryCount < i.maxRetries)
    .sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, SYNC_CONFIG.batchSize);

  let processed = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: item.operation,
          payload: item.payload,
          metadata: item.metadata,
        }),
      });

      if (response.ok) {
        await queueRemove(item.id);
        processed++;
        broadcastSyncStatus();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      failed++;
      item.retryCount++;
      await queueUpdate(item);
      broadcastSyncStatus();
    }
  }

  return { processed, failed };
}

async function broadcastSyncStatus(): Promise<void> {
  const items = await queueGetAll();
  const status: SyncStatus = {
    isOnline: navigator.onLine,
    queueLength: items.length,
    pendingHighPriority: items.filter(i => i.priority === 'high' && i.retryCount < i.maxRetries).length,
    lastSyncAttempt: Date.now(),
    lastSuccessfulSync: null,
    syncErrors: items
      .filter(i => i.retryCount >= i.maxRetries)
      .map(i => ({
        itemId: i.id,
        error: 'Max retries exceeded',
        timestamp: i.timestamp,
        retryCount: i.retryCount,
      })),
  };

  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_STATUS_UPDATE',
        payload: status,
      } as SyncQueueOutboundMessage);
    });
  });
}

/* ════════════════════════════════════════════════════════════════════
   CACHE STRATEGIES
════════════════════════════════════════════════════════════════════ */

async function matchStrategy(request: Request): Promise<CacheStrategy | null> {
  const url = new URL(request.url);
  for (const strategy of CACHE_STRATEGIES) {
    if (strategy.patterns.some(p => p.test(url.pathname) || p.test(request.url))) {
      return strategy;
    }
  }
  return null;
}

async function cacheFirst(request: Request, strategy: CacheStrategy): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    const age = Date.now() - (cached.headers.get('sw-cached-at') ? parseInt(cached.headers.get('sw-cached-at')!) : 0);
    if (!strategy.maxAgeSeconds || age < strategy.maxAgeSeconds * 1000) {
      return cached;
    }
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-at', Date.now().toString());
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers,
      });
      await cache.put(request, cachedResponse);
      await enforceCacheLimit(cache, strategy);
    }
    return networkResponse;
  } catch {
    return cached || new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request: Request, strategy: CacheStrategy): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-at', Date.now().toString());
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers,
      });
      await cache.put(request, cachedResponse);
      await enforceCacheLimit(cache, strategy);
    }
    return networkResponse;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request: Request, strategy: CacheStrategy): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-at', Date.now().toString());
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers,
      });
      cache.put(request, cachedResponse).then(() => enforceCacheLimit(cache, strategy));
    }
    return networkResponse;
  }).catch(() => cached || new Response('Offline', { status: 503 }));

  return cached || fetchPromise;
}

async function networkOnly(request: Request): Promise<Response> {
  return fetch(request);
}

async function enforceCacheLimit(cache: Cache, strategy: CacheStrategy): Promise<void> {
  if (!strategy.maxEntries) return;
  const keys = await cache.keys();
  if (keys.length > strategy.maxEntries) {
    await cache.delete(keys[0]);
  }
}

/* ════════════════════════════════════════════════════════════════════
   SERVICE WORKER LIFECYCLE
════════════════════════════════════════════════════════════════════ */

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
      ]);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== OFFLINE_CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  event.respondWith(
    (async () => {
      const strategy = await matchStrategy(request);

      if (!strategy) {
        return fetch(request);
      }

      switch (strategy.strategy) {
        case 'cache-first':
          return cacheFirst(request, strategy);
        case 'network-first':
          return networkFirst(request, strategy);
        case 'stale-while-revalidate':
          return staleWhileRevalidate(request, strategy);
        case 'network-only':
          return networkOnly(request);
        default:
          return fetch(request);
      }
    })()
  );
});

/* ════════════════════════════════════════════════════════════════════
   BACKGROUND SYNC & MESSAGE HANDLING
═════════════════════════════════════════════════════════════════════ */

let syncInterval: number | null = null;

function startSyncInterval(): void {
  if (syncInterval) return;
  syncInterval = self.setInterval(async () => {
    if (navigator.onLine) {
      await processSyncQueue();
    }
  }, SYNC_CONFIG.flushIntervalMs);
}

function stopSyncInterval(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'learning-sync') {
    event.waitUntil(processSyncQueue());
  }
});

self.addEventListener('message', async (event: ExtendableMessageEvent) => {
  const data = event.data as SyncQueueInboundMessage | { type: 'GET_SYNC_STATUS' };

  switch (data.type) {
    case 'SYNC_QUEUE_PUSH': {
      const id = await queuePush(data.payload);
      event.ports[0]?.postMessage({ type: 'SYNC_QUEUE_PUSH', payload: { id } });
      if (navigator.onLine) processSyncQueue();
      break;
    }

    case 'SYNC_QUEUE_FLUSH': {
      const result = await processSyncQueue();
      event.ports[0]?.postMessage({ type: 'SYNC_QUEUE_FLUSHED', payload: result });
      break;
    }

    case 'SYNC_QUEUE_ONLINE': {
      startSyncInterval();
      await processSyncQueue();
      broadcastSyncStatus();
      break;
    }

    case 'SYNC_QUEUE_OFFLINE': {
      stopSyncInterval();
      broadcastSyncStatus();
      break;
    }

    case 'SYNC_QUEUE_CLEAR': {
      await queueClear(data.payload?.itemIds);
      broadcastSyncStatus();
      break;
    }

    case 'GET_SYNC_STATUS': {
      const status: SyncStatus = {
        isOnline: navigator.onLine,
        queueLength: (await queueGetAll()).length,
        pendingHighPriority: 0,
        lastSyncAttempt: Date.now(),
        lastSuccessfulSync: null,
        syncErrors: [],
      };
      event.ports[0]?.postMessage({ type: 'SYNC_STATUS_UPDATE', payload: status });
      break;
    }
  }
});

self.addEventListener('online', () => {
  startSyncInterval();
  processSyncQueue();
  broadcastSyncStatus();
});

self.addEventListener('offline', () => {
  stopSyncInterval();
  broadcastSyncStatus();
});

self.addEventListener('periodicsync', (event: ExtendableEvent) => {
  if (event.tag === 'learning-sync') {
    event.waitUntil(processSyncQueue());
  }
});

startSyncInterval();

export type {};