declare module "node:http" {
  export interface IncomingHttpHeaders { readonly [key: string]: string | string[] | undefined; }
  export interface IncomingMessage extends AsyncIterable<Uint8Array | string> { readonly method?: string; readonly url?: string; readonly headers: IncomingHttpHeaders; readonly rawHeaders: string[]; }
  export interface ServerResponse { statusCode: number; setHeader(name: string, value: string | number): void; end(body?: string): void; }
  export interface Server { listen(port: number, host?: string): Server; close(callback?: (error?: Error) => void): Server; once(event: "close", listener: () => void): Server; }
  export function createServer(handler: (request: IncomingMessage, response: ServerResponse) => void | Promise<void>): Server;
}
