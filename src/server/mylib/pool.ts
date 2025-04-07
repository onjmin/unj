import pg, { type PoolClient } from "pg";
import { logger } from "../mylib/log.js";

export const NEON_DATABASE_URL = String(process.env.NEON_DATABASE_URL);
export const pool = new pg.Pool({
	connectionString: NEON_DATABASE_URL,
	ssl: { rejectUnauthorized: false },
	max: 32, // 保持するコネクション数32（デフォルト10）
	idleTimeoutMillis: 8_000, // 自動切断時間8秒（デフォルト10秒）
	connectionTimeoutMillis: 8_000, // 接続確立のタイムアウト8秒（DBが落ちている時に無駄に待たないように）
});

pool.on("error", (error) => {
	logger.error(error);
});

export const onError = (poolClient: PoolClient) => {
	if (poolClient.listenerCount("error")) return;
	poolClient.on("error", (error) => {
		logger.error(error);
	});
};
