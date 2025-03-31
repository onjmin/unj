import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { NEON_DATABASE_URL } from "../mylib/env.js";
neonConfig.webSocketConstructor = ws;

export const pool = new Pool({ connectionString: NEON_DATABASE_URL });
