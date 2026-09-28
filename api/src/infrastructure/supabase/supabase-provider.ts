export const persistenceProviders = ["mock", "supabase"] as const;

export type PersistenceProvider = (typeof persistenceProviders)[number];

export const authProviders = ["mock", "supabase"] as const;

export type AuthProvider = (typeof authProviders)[number];
