const SUPABASE_DIRECT_SUFFIX = ".supabase.co";
const SUPABASE_POOLER_SUFFIX = ".pooler.supabase.com";
const DNS_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const PROJECT_REF = /^[a-z0-9]{20}$/;

export const PostgresTargetKind = Object.freeze({
  direct: "supabase_direct",
  sessionPooler: "supabase_session_pooler",
});

function validProjectRef(value) {
  return typeof value === "string" && PROJECT_REF.test(value);
}

function isRawPostgresScheme(value) {
  return typeof value === "string" && (value.startsWith("postgres://") || value.startsWith("postgresql://"));
}

function exactSecurityQuery(url) {
  const entries = [...url.searchParams.entries()];
  return url.search === "?sslmode=verify-full"
    && entries.length === 1
    && entries[0][0] === "sslmode"
    && entries[0][1] === "verify-full";
}

function exactDatabase(url) {
  return url.pathname === "/postgres";
}

function structuralPasswordPresent(url) {
  return url.password.length > 0;
}

function rawHostAndPort(value) {
  const authorityAndPath = value.slice(value.indexOf("://") + 3);
  const authority = authorityAndPath.split(/[/?#]/, 1)[0];
  if (authority.indexOf("@") !== authority.lastIndexOf("@")) return undefined;
  const hostAndPort = authority.slice(authority.lastIndexOf("@") + 1);
  if (!hostAndPort || hostAndPort.includes("[")) return undefined;
  const separator = hostAndPort.lastIndexOf(":");
  if (separator < 0) return { host: hostAndPort, port: undefined };
  if (hostAndPort.indexOf(":") !== separator) return undefined;
  return { host: hostAndPort.slice(0, separator), port: hostAndPort.slice(separator + 1) };
}

function isConservativePoolerHost(hostname) {
  if (!hostname.endsWith(SUPABASE_POOLER_SUFFIX)) return false;
  const prefix = hostname.slice(0, -SUPABASE_POOLER_SUFFIX.length);
  return DNS_LABEL.test(prefix);
}

function isBaseTarget(url, value) {
  return isRawPostgresScheme(value)
    && (url.protocol === "postgres:" || url.protocol === "postgresql:")
    && !url.hash
    && exactSecurityQuery(url)
    && exactDatabase(url)
    && structuralPasswordPresent(url);
}

/**
 * Classifies only approved locked Supabase PostgreSQL targets. It deliberately
 * exposes no URL details or failure reason, so callers can use a sanitized
 * valid/invalid decision before opening a certificate or transport.
 */
export function classifyPostgresTarget(value, projectRef) {
  if (!validProjectRef(projectRef) || typeof value !== "string" || !isRawPostgresScheme(value)) return undefined;

  let url;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }

  if (!isBaseTarget(url, value)) return undefined;
  const rawTarget = rawHostAndPort(value);
  if (!rawTarget || rawTarget.host !== url.hostname) return undefined;

  const directHost = `db.${projectRef}${SUPABASE_DIRECT_SUFFIX}`;
  if (
    url.hostname === directHost
    && (rawTarget.port === undefined || rawTarget.port === "5432")
    && (url.port === "" || url.port === "5432")
    && url.username === "postgres"
  ) {
    return PostgresTargetKind.direct;
  }

  if (
    isConservativePoolerHost(url.hostname)
    && rawTarget.port === "5432"
    && url.port === "5432"
    && url.username === `postgres.${projectRef}`
  ) {
    return PostgresTargetKind.sessionPooler;
  }

  return undefined;
}
