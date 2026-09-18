/** PostgreSQL accepts UUID values by hexadecimal shape, regardless of RFC version nibble. */
export const POSTGRES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isPostgresUuid = (value: string | undefined): value is string => Boolean(value && POSTGRES_UUID.test(value));