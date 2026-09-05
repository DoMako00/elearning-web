import { createAdminM2CommandFingerprint } from "./admin-m2-command-executor";
function assert(value:unknown,message:string):asserts value {if(!value)throw new Error(message);}
export function runAdminM2CommandExecutorSelfTest(){const a=createAdminM2CommandFingerprint({b:2,a:1});const b=createAdminM2CommandFingerprint({a:1,b:2});assert(/^[0-9a-f]{64}$/.test(a),"fingerprint must meet M4A hex constraint");assert(a===b,"fingerprint must be key-order independent");}
if(process.argv[1]?.endsWith("admin-m2-command-executor.selftest.js")){runAdminM2CommandExecutorSelfTest();console.log("admin M2 command executor selftest passed");}
