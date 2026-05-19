import path from 'path';
import fs from 'fs';
import { defineConfig } from 'prisma/config';

// Prisma CLI doesn't load .env.local automatically — do it here so
// `prisma db push`, `prisma migrate` etc. pick up DATABASE_URL.
try {
  const envLocalPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const lines = fs.readFileSync(envLocalPath, 'utf-8').split('\n');
    for (const line of lines) {
      const match = line.match(/^([^=#\s][^=]*)=(.*)/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (!process.env[key]) process.env[key] = value;
      }
    }
  }
} catch {
  // silently ignore — DATABASE_URL may already be set via the system environment
}

export default defineConfig({
  schema: path.join(__dirname, 'prisma/schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
