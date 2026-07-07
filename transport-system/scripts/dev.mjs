/**
 * One-command local dev — no Docker required.
 *
 *   npm run dev
 *
 * Steps:
 *   1. Boot a self-contained Postgres (downloaded automatically, stored in .devdata/)
 *   2. prisma db push  (create tables) + seed (demo shipper / carrier / admin + a job)
 *   3. Start the API (:4000) and the web app (:3000) together, with prefixed logs
 *
 * No Redis, S3, or PostGIS needed locally — the app degrades gracefully (see
 * GeoService / StorageService / main.ts). Point DATABASE_URL at Aurora/Neon for prod.
 */
import EmbeddedPostgres from 'embedded-postgres';
import { spawn } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DB = { user: 'athena', password: 'athena', port: 5432, database: 'athena_transport' };
const DATABASE_URL = `postgresql://${DB.user}:${DB.password}@localhost:${DB.port}/${DB.database}?schema=public`;
const dataDir = join(root, '.devdata', 'pg');

const log = (m) => console.log(`\x1b[36m[dev]\x1b[0m ${m}`);

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: true, cwd: root, ...opts });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

function stream(name, cmd, args, env) {
  const p = spawn(cmd, args, { shell: true, cwd: root, env: { ...process.env, ...env } });
  const tag = `\x1b[35m[${name}]\x1b[0m `;
  p.stdout.on('data', (d) => process.stdout.write(tag + d.toString().replace(/\n/g, '\n' + tag)));
  p.stderr.on('data', (d) => process.stderr.write(tag + d.toString().replace(/\n/g, '\n' + tag)));
  return p;
}

async function main() {
  const pg = new EmbeddedPostgres({ ...DB, databaseDir: dataDir, persistent: true });

  if (!existsSync(dataDir)) {
    log('Initialising local Postgres (first run only, downloads binary)…');
    await pg.initialise();
  }
  log('Starting local Postgres on :5432…');
  await pg.start();
  try {
    await pg.createDatabase(DB.database);
  } catch {
    /* database already exists — fine */
  }

  const env = { DATABASE_URL };
  log('Building shared types package…');
  await run('npm', ['run', 'build', '--workspace', '@athenagrid/shared'], { env });
  log('Applying schema (prisma db push)…');
  await run('npm', ['run', 'prisma:generate', '--workspace', '@athenagrid/api'], { env });
  await run('npx', ['prisma', 'db', 'push', '--skip-generate'], {
    env,
    cwd: join(root, 'apps', 'api'),
  });
  log('Seeding demo data…');
  await run('npm', ['run', 'seed', '--workspace', '@athenagrid/api'], { env });

  // Clear any stale build output + incremental cache so Nest always emits a
  // fresh dist/main.js (TypeScript's .tsbuildinfo can otherwise skip emitting).
  rmSync(join(root, 'apps', 'api', 'dist'), { recursive: true, force: true });
  rmSync(join(root, 'apps', 'api', 'tsconfig.tsbuildinfo'), { force: true });

  log('Starting API (:4000) and web (:3000). Press Ctrl+C to stop.');
  const api = stream('api', 'npm', ['run', 'start:dev', '--workspace', '@athenagrid/api'], env);
  const web = stream('web', 'npm', ['run', 'dev', '--workspace', '@athenagrid/web'], env);

  const shutdown = async () => {
    log('Shutting down…');
    api.kill();
    web.kill();
    await pg.stop().catch(() => {});
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((e) => {
  console.error(`\x1b[31m[dev] ${e.message}\x1b[0m`);
  process.exit(1);
});
