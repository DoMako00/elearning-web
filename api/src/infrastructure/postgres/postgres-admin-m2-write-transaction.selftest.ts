import { PostgresAdminM2WriteTransactionRunner, type PgWriteClientLike, type PgWritePoolLike } from "./postgres-admin-m2-write-transaction";
import { ok } from "../../shared";

function assert(value:unknown,message:string):asserts value { if(!value) throw new Error(message); }
class Client implements PgWriteClientLike { calls:string[]=[]; async query(text:string){this.calls.push(text);return{rows:[]};} release(){} }
class Pool implements PgWritePoolLike { readonly client=new Client(); async connect(){return this.client;} async end(){} }
export async function runPostgresAdminM2WriteTransactionSelfTest(){const pool=new Pool();const runner=new PostgresAdminM2WriteTransactionRunner(pool);const result=await runner.run("test",async()=>ok("done"));assert(result.ok&&result.value==="done","transaction result missing");assert(pool.client.calls.join("|")==="BEGIN|COMMIT","transaction ordering invalid");await runner.close();}
if(process.argv[1]?.endsWith("postgres-admin-m2-write-transaction.selftest.js"))runPostgresAdminM2WriteTransactionSelfTest().then(()=>console.log("postgres M2 write transaction selftest passed"));
