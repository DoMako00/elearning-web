import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { openApiDocument } from "../src/http/openapi";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Export to repo root openapi.json (and optional destination via CLI arg)
const targetPath = process.argv[2]
  ? resolve(process.cwd(), process.argv[2])
  : resolve(__dirname, "../../openapi.json");

writeFileSync(targetPath, JSON.stringify(openApiDocument, null, 2) + "\n", "utf-8");
console.log(`[export-openapi-spec] Successfully exported OpenAPI spec to ${targetPath}`);
