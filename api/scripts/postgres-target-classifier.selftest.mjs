import { classifyPostgresTarget, PostgresTargetKind } from "./postgres-target-classifier.mjs";

function assert(value, message) {
  if (!value) throw new Error(message);
}

const projectRef = "abcdefghijklmnopqrst";
const direct = `postgresql://postgres:synthetic-password@db.${projectRef}.supabase.co:5432/postgres?sslmode=verify-full`;
const directDefaultPort = `postgresql://postgres:synthetic-password@db.${projectRef}.supabase.co/postgres?sslmode=verify-full`;
const pooler = `postgresql://postgres.${projectRef}:synthetic%40password@aws-0-eu-west-3.pooler.supabase.com:5432/postgres?sslmode=verify-full`;

assert(classifyPostgresTarget(direct, projectRef) === PostgresTargetKind.direct, "exact direct target must pass");
assert(classifyPostgresTarget(directDefaultPort, projectRef) === PostgresTargetKind.direct, "direct default port must represent 5432");
assert(classifyPostgresTarget(pooler, projectRef) === PostgresTargetKind.sessionPooler, "exact session pooler target must pass");
assert(classifyPostgresTarget(direct.replace("postgresql:", "postgres:"), projectRef) === PostgresTargetKind.direct, "postgres direct target must pass");
assert(classifyPostgresTarget(pooler.replace("postgresql:", "postgres:"), projectRef) === PostgresTargetKind.sessionPooler, "postgres pooler target must pass");

const rejected = [
  `postgresql://postgres.${projectRef}:synthetic@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=verify-full`,
  `postgresql://postgres.${projectRef}:synthetic@aws-0-eu-west-3.pooler.supabase.com:05432/postgres?sslmode=verify-full`,
  `postgresql://postgres.${projectRef}:synthetic@aws-0-eu-west-3.pooler.supabase.com/postgres?sslmode=verify-full`,
  `postgresql://postgres:synthetic@aws-0-eu-west-3.pooler.supabase.com:5432/postgres?sslmode=verify-full`,
  `postgresql://postgres.wrongprojectreference:synthetic@aws-0-eu-west-3.pooler.supabase.com:5432/postgres?sslmode=verify-full`,
  `postgresql://postgres.${projectRef}:@aws-0-eu-west-3.pooler.supabase.com:5432/postgres?sslmode=verify-full`,
  `postgresql://postgres.${projectRef}:synthetic@aws-0-eu-west-3.pooler.supabase.com:5432/?sslmode=verify-full`,
  `postgresql://postgres.${projectRef}:synthetic@aws-0-eu-west-3.pooler.supabase.com:5432/wrong?sslmode=verify-full`,
  `postgresql://postgres.${projectRef}:synthetic@aws-0-eu-west-3.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${projectRef}:synthetic@aws-0-eu-west-3.pooler.supabase.com:5432/postgres?sslmode=require`,
  `postgresql://postgres.${projectRef}:synthetic@aws-0-eu-west-3.pooler.supabase.com:5432/postgres?sslmode=verify-ca`,
  `postgresql://postgres.${projectRef}:synthetic@aws-0-eu-west-3.pooler.supabase.com:5432/postgres?sslmode=verify-full&sslmode=verify-full`,
  `postgresql://postgres.${projectRef}:synthetic@aws-0-eu-west-3.pooler.supabase.com:5432/postgres?sslmode=verify-full&host=localhost`,
  `postgresql://postgres.${projectRef}:synthetic@pooler.supabase.com.attacker.example:5432/postgres?sslmode=verify-full`,
  `postgresql://postgres.${projectRef}:synthetic@attacker-pooler.supabase.com:5432/postgres?sslmode=verify-full`,
  `postgresql://postgres.${projectRef}:synthetic@pooler.supabase.com:5432/postgres?sslmode=verify-full`,
  `postgresql://postgres.${projectRef}:synthetic@pooler.supabase.com.example:5432/postgres?sslmode=verify-full`,
  `postgresql://postgres.${projectRef}:synthetic@127.0.0.1:5432/postgres?sslmode=verify-full`,
  `postgresql://postgres.${projectRef}:synthetic@localhost:5432/postgres?sslmode=verify-full`,
  `postgresql://postgres.${projectRef}:synthetic@attacker@aws-0-eu-west-3.pooler.supabase.com:5432/postgres?sslmode=verify-full`,
  `postgresql://postgres.${projectRef}:synthetic@aws-0-eu-west-3.pooler.supabase.com%2F.attacker.example:5432/postgres?sslmode=verify-full`,
  `postgresql://postgres.${projectRef}:synthetic@aws-0-eu-west-3.pooler.supabase.com:5432/postgres?sslmode=verify-full#fragment`,
  `postgresql://postgres:synthetic@db.${projectRef}.supabase.co:5432/postgres?sslmode=verify-full&sslmode=verify-full`,
  `postgresql://postgres:synthetic@db.${projectRef}.supabase.co:5432/postgres?sslmode=verify-full&options=-csearch_path%3Dpublic`,
  `postgresql://postgres:synthetic@db.${projectRef}.supabase.co.attacker.example:5432/postgres?sslmode=verify-full`,
  `postgresql://postgres:synthetic@db.${projectRef}.supabase.co:5432/postgres?sslmode=VERIFY-FULL`,
  `postgresql://postgres:synthetic@db.${projectRef}.supabase.co:5432/postgres?sslmode=verify%2Dfull`,
  `postgresql://postgres:synthetic@db.${projectRef}.supabase.co:5432/postgres?SSLmode=verify-full`,
  `postgresql://postgres:synthetic@db.${projectRef}.supabase.co:5432/postgres?sslmode=verify-full#fragment`,
  `postgresql://postgres:synthetic@db.${projectRef}.supabase.co:5432/postgres?sslmode=verify-full&application_name=unsafe`,
  `postgresql://postgres:synthetic@DB.${projectRef}.SUPABASE.CO:5432/postgres?sslmode=verify-full`,
  `postgresql://postgres:synthetic@db.${projectRef}.supabase.co:05432/postgres?sslmode=verify-full`,
];

for (const value of rejected) assert(classifyPostgresTarget(value, projectRef) === undefined, "unsafe or ambiguous target must fail closed");
assert(classifyPostgresTarget(pooler, "invalid") === undefined, "invalid locked project reference must fail closed");
assert(classifyPostgresTarget(`POSTGRESQL://postgres:synthetic@db.${projectRef}.supabase.co:5432/postgres?sslmode=verify-full`, projectRef) === undefined, "scheme case ambiguity must fail closed");

console.log("postgres target classifier selftest passed");
