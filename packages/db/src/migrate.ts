import { createClient, type Client } from "@libsql/client";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface MigrationResult {
  appliedMigrations: string[];
}

function migrationsDirectory(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");
}

export async function createLocalClient(url = ":memory:"): Promise<Client> {
  const client = createClient({ url });
  await client.execute("PRAGMA foreign_keys = ON");
  return client;
}

export async function runMigrations(
  client: Client,
  directory = migrationsDirectory(),
): Promise<MigrationResult> {
  await client.execute("PRAGMA foreign_keys = ON");
  await client.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  const migrationFiles = (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort();
  const appliedMigrations: string[] = [];

  for (const migrationFile of migrationFiles) {
    const existing = await client.execute({
      sql: "SELECT name FROM schema_migrations WHERE name = ?",
      args: [migrationFile],
    });
    if (existing.rows.length > 0) {
      continue;
    }

    const sql = await readFile(join(directory, migrationFile), "utf8");
    await client.executeMultiple(sql);
    await client.execute({
      sql: "INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)",
      args: [migrationFile, new Date().toISOString()],
    });
    appliedMigrations.push(migrationFile);
  }

  return { appliedMigrations };
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  const client = await createLocalClient(process.env.DATABASE_URL ?? "file:stockmarket-dev.db");
  try {
    const result = await runMigrations(client);
    console.log(`Applied ${result.appliedMigrations.length} migration(s).`);
  } finally {
    client.close();
  }
}
