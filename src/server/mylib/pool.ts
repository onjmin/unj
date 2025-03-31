import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { logger } from "../mylib/log.js";

neonConfig.webSocketConstructor = ws;
export const NEON_DATABASE_URL = String(process.env.NEON_DATABASE_URL);
export const pool = new Pool({ connectionString: NEON_DATABASE_URL });

pool.on("error", (error) => {
	logger.error(error);
});
