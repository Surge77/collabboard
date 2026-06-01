import { z } from 'zod';

// Validate environment variables once, at module load. Phase 0 keys are required
// in production; later-phase keys (Liveblocks, AI) stay optional until those
// phases ship. Keep this server-only — never import it into client components.
const isProduction = process.env.NODE_ENV === 'production';

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  AUTH_SECRET: isProduction ? z.string().min(1) : z.string().min(1).optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),
  DATABASE_URL: isProduction ? z.string().url() : z.string().url().optional(),
  DIRECT_URL: z.string().url().optional(),
  LIVEBLOCKS_SECRET_KEY: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
});

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', z.treeifyError(parsed.error));
  throw new Error('Invalid environment variables — see logs above.');
}

export const env = parsed.data;
