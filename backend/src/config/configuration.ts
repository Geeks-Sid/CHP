import { z } from 'zod';

const configSchema = z.object({
  // Database
  PGHOST: z.string().default('localhost'),
  PGPORT: z.coerce.number().default(5432),
  PGDATABASE: z.string().default('hospital'),
  PGUSER: z.string().default('hospital'),
  PGPASSWORD: z.string().default('password'),
  PGSSL: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(32).default('replace-me-with-secure-secret-key-min-32-chars'),
  JWT_ACCESS_TTL: z.coerce.number().default(900), // 15 minutes
  JWT_REFRESH_TTL: z.coerce.number().default(604800), // 7 days
  JWT_ISSUER: z.string().default('hospital-ms'),

  // S3/MinIO
  S3_ENDPOINT: z.string().default('http://localhost:9000'),
  S3_ACCESS_KEY: z.string().default('minio'),
  S3_SECRET_KEY: z.string().default('minio123'),
  S3_BUCKET: z.string().default('documents'),
  S3_REGION: z.string().default('us-east-1'),

  // Server
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().optional(),

  // Redis (optional)
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().optional(),
  REDIS_PASSWORD: z.string().optional(),
});

export type Configuration = z.infer<typeof configSchema>;

export function configuration(): Configuration {
  const parsed = configSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Configuration validation failed:', parsed.error.format());
    throw new Error('Invalid configuration');
  }

  return parsed.data;
}

