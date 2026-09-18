begin;

select plan(12);

select has_schema('app', 'Migration 000 creates the private app schema.');

select is(
  (
    select count(*)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'app'
      and p.proname = 'set_updated_at'
      and p.pronargs = 0
  ),
  1::bigint,
  'Migration 000 creates exactly one zero-argument private trigger utility.'
);

select function_returns(
  'app',
  'set_updated_at',
  array[]::text[],
  'trigger',
  'The trigger utility returns trigger.'
);

select is(
  (
    select p.prosecdef
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'app' and p.proname = 'set_updated_at'
  ),
  false,
  'The trigger utility is SECURITY INVOKER, not SECURITY DEFINER.'
);

select is(
  (
    select array_to_string(p.proconfig, ',')
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'app' and p.proname = 'set_updated_at'
  ),
  'search_path=pg_catalog, app',
  'The trigger utility has the approved fixed search path.'
);

select ok(
  to_regprocedure('pg_catalog.gen_random_uuid()') is not null
  or to_regprocedure('extensions.gen_random_uuid()') is not null,
  'A supported database UUID generation capability is available.'
);

select ok(not has_schema_privilege('public', 'app', 'usage'), 'PUBLIC has no app schema usage.');
select ok(not has_schema_privilege('anon', 'app', 'usage'), 'anon has no app schema usage.');
select ok(not has_schema_privilege('authenticated', 'app', 'usage'), 'authenticated has no app schema usage.');

select ok(not has_function_privilege('public', 'app.set_updated_at()', 'execute'), 'PUBLIC cannot execute the private utility.');
select ok(not has_function_privilege('anon', 'app.set_updated_at()', 'execute'), 'anon cannot execute the private utility.');
select ok(not has_function_privilege('authenticated', 'app.set_updated_at()', 'execute'), 'authenticated cannot execute the private utility.');

select * from finish();

rollback;
