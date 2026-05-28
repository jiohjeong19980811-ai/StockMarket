import { z } from "zod";

const envSchema = z.object({
  APP_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  LIVE_TRADING_ENABLED: z
    .enum(["false", "False", "FALSE", "0", "true", "True", "TRUE", "1"])
    .default("false")
    .transform((value) => value === "true" || value === "True" || value === "TRUE" || value === "1")
});

export type ApiEnv = {
  APP_ENV: "development" | "test" | "production";
  API_PORT: number;
  LIVE_TRADING_ENABLED: boolean;
};

export function loadEnv(source: NodeJS.ProcessEnv = process.env): ApiEnv {
  const parsed = envSchema.parse(source);
  if (parsed.LIVE_TRADING_ENABLED) {
    throw new Error("LIVE_TRADING_ENABLED must remain false in MVP");
  }
  return parsed;
}
