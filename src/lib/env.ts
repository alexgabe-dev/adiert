import 'server-only';

import { z } from 'zod';

const serverEnvironmentSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
});

const parsedEnvironment = serverEnvironmentSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!parsedEnvironment.success) {
  throw new Error(`Invalid environment configuration: ${z.prettifyError(parsedEnvironment.error)}`);
}

export const environment = Object.freeze(parsedEnvironment.data);
