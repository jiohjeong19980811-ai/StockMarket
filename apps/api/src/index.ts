import { loadEnv } from "./env.js";
import { buildServer } from "./server.js";

const env = loadEnv();
const server = buildServer(env);

await server.listen({ port: env.API_PORT, host: "127.0.0.1" });
