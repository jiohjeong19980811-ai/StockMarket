import { createClient, type Client } from "@libsql/client";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface MigrationResult {
  appliedMigrations: string[];
}

function migrationChecksum(sql: string): string {
  return createHash("sha256").update(sql).digest("hex");
}

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let quote: "'" | '"' | "`" | null = null;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    const next = sql[index + 1];

    if (char === undefined) {
      continue;
    }

    if (inLineComment) {
      current += char;
      if (char === "\n") {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      current += char;
      if (char === "*" && next === "/") {
        current += next;
        index += 1;
        inBlockComment = false;
      }
      continue;
    }

    if (quote !== null) {
      current += char;
      if (char === quote) {
        if (next === quote) {
          current += next;
          index += 1;
        } else {
          quote = null;
        }
      }
      continue;
    }

    if (char === "-" && next === "-") {
      current += char + next;
      index += 1;
      inLineComment = true;
      continue;
    }

    if (char === "/" && next === "*") {
      current += char + next;
      index += 1;
      inBlockComment = true;
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      current += char;
      continue;
    }

    if (char === ";") {
      const statement = current.trim();
      if (statement.length > 0) {
        statements.push(statement);
      }
      current = "";
      continue;
    }

    current += char;
  }

  const finalStatement = current.trim();
  if (finalStatement.length > 0) {
    statements.push(finalStatement);
  }

  return statements;
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
      checksum TEXT NOT NULL,
      applied_at TEXT NOT NULL
    )
  `);
  const migrationColumns = await client.execute("PRAGMA table_info(schema_migrations)");
  if (!migrationColumns.rows.some((row) => row.name === "checksum")) {
    await client.execute("ALTER TABLE schema_migrations ADD COLUMN checksum TEXT");
  }

  const migrationFiles = (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort();
  const appliedMigrations: string[] = [];

  for (const migrationFile of migrationFiles) {
    const sql = await readFile(join(directory, migrationFile), "utf8");
    const checksum = migrationChecksum(sql);
    const existing = await client.execute({
      sql: "SELECT name, checksum FROM schema_migrations WHERE name = ?",
      args: [migrationFile],
    });
    if (existing.rows.length > 0) {
      const storedChecksum = existing.rows[0]?.checksum;
      if (storedChecksum === null || storedChecksum === undefined || storedChecksum === "") {
        await client.execute({
          sql: "UPDATE schema_migrations SET checksum = ? WHERE name = ?",
          args: [checksum, migrationFile],
        });
      } else if (storedChecksum !== checksum) {
        throw new Error(`Migration checksum mismatch for ${migrationFile}`);
      }
      continue;
    }

    const migrationStatements = splitSqlStatements(sql).map((statement) => ({
      sql: statement,
      args: [],
    }));
    await client.batch(
      [
        ...migrationStatements,
        {
          sql: "INSERT INTO schema_migrations (name, checksum, applied_at) VALUES (?, ?, ?)",
          args: [migrationFile, checksum, new Date().toISOString()],
        },
      ],
      "write",
    );
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
