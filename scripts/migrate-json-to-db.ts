/**
 * One-time migration: imports existing JSON data files into the Postgres database.
 *
 * Run AFTER setting DATABASE_URL in your environment:
 *   npx ts-node --project tsconfig.json scripts/migrate-json-to-db.ts
 *
 * Or with tsx (no compile step):
 *   npx tsx scripts/migrate-json-to-db.ts
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Load .env.local so DATABASE_URL is available when running via tsx
try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
      const m = line.match(/^([^=#\s][^=]*)=(.*)/);
      if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim();
    }
  }
} catch {}

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  const dataDir = path.join(process.cwd(), 'data');

  // ── External events ──────────────────────────────────────────────────────────
  const eventsFile = path.join(dataDir, 'events.json');
  if (fs.existsSync(eventsFile)) {
    const events = JSON.parse(fs.readFileSync(eventsFile, 'utf-8'));
    console.log(`Migrating ${events.length} external events…`);
    for (const event of events) {
      await prisma.externalEvent.upsert({
        where: { id: event.id },
        update: { data: event },
        create: { id: event.id, data: event },
      });
    }
    console.log('✓ External events done');
  } else {
    console.log('No events.json found — skipping external events');
  }

  // ── Internal events ──────────────────────────────────────────────────────────
  const internalFile = path.join(dataDir, 'internal-events.json');
  if (fs.existsSync(internalFile)) {
    const internalEvents = JSON.parse(fs.readFileSync(internalFile, 'utf-8'));
    console.log(`Migrating ${internalEvents.length} internal events…`);
    for (const event of internalEvents) {
      await prisma.internalEvent.upsert({
        where: { id: event.id },
        update: { data: event },
        create: { id: event.id, data: event },
      });
    }
    console.log('✓ Internal events done');
  } else {
    console.log('No internal-events.json found — skipping internal events');
  }

  // ── Settings ─────────────────────────────────────────────────────────────────
  const settingsFile = path.join(dataDir, 'settings.json');
  if (fs.existsSync(settingsFile)) {
    const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
    console.log('Migrating settings…');
    await prisma.appSettings.upsert({
      where: { id: 1 },
      update: { data: settings },
      create: { id: 1, data: settings },
    });
    console.log('✓ Settings done');
  } else {
    console.log('No settings.json found — skipping settings');
  }

  console.log('\n✅ Migration complete.');
}

main()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
