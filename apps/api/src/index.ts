import { loadEnv } from "./env";
import { buildServer } from "./server";

const env = loadEnv();
const server = buildServer(env);

await server.listen({ port: env.API_PORT, host: "127.0.0.1" });
