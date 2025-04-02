import pg from "pg";
import { logger } from "../mylib/log.js";

export const NEON_DATABASE_URL = String(process.env.NEON_DATABASE_URL);
export const pool = new pg.Pool({ connectionString: NEON_DATABASE_URL });

pool.on("error", (error) => {
	logger.error(error);
});
