import pg, { type PoolClient } from "pg";
import { logger } from "../mylib/log.js";

export const NEON_DATABASE_URL = String(process.env.NEON_DATABASE_URL);
export const pool = new pg.Pool({
	connectionString: NEON_DATABASE_URL,
	ssl: { rejectUnauthorized: false },
	keepAlive: true,
	max: 16, // 最大接続数16（デフォルト10）
	idleTimeoutMillis: 16_000, // 16秒（デフォルト10秒, リクエスト間隔を考慮して少し長め）
	connectionTimeoutMillis: 4_000, // 接続確立のタイムアウト（DBが落ちている時に無駄に待たないように）
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
