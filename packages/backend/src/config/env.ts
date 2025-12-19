import { z } from "zod";
import dotenv from "dotenv";
import path from "path";

const currentEnv = process.env.NODE_ENV ?? "development";
const baseEnvPath = path.resolve(process.cwd(), ".env");
const specificEnvPath = path.resolve(process.cwd(), `.env.${currentEnv}`);

dotenv.config({ path: baseEnvPath });
dotenv.config({ path: specificEnvPath });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("3001"),
  DATABASE_URL: z.string().min(1),
});

export const env = envSchema.parse(process.env);
