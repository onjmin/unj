import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { NEON_DATABASE_URL } from "../mylib/env.js";
import { logger } from "../mylib/log.js";

neonConfig.webSocketConstructor = ws;

export const pool = new Pool({ connectionString: NEON_DATABASE_URL });

pool.on("error", (error) => {
	logger.error(error);
});
