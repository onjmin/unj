import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { logger } from "../mylib/log.js";

neonConfig.webSocketConstructor = ws;

if (process.env.DEV_MODE === "true") {
	// ローカル docker-compose (db-neon + wsproxy) 経由で繋ぐ。
	// NEON_DATABASE_URL のホスト名（wsproxyのALLOW_ADDR_REGEXが見る宛先）は "db-neon" のまま、
	// 実際の接続先だけこのwsProxyでlocalhostのプロキシに向ける。
	// 公式ドキュメント (CONFIG.md#wsproxy): wsproxyの場合 `<proxyのホスト:ポート>/v1?address=<接続先host:port>`
	// の形式で、実際のダイヤル先(localhost:8081)と接続先(db-neon:5432)をクエリパラメータで分離する。
	neonConfig.wsProxy = (host, port) => `localhost:8081/v1?address=${host}:${port}`;
	neonConfig.useSecureWebSocket = false;
	neonConfig.pipelineTLS = false;
	neonConfig.pipelineConnect = false;
}

export const NEON_DATABASE_URL = String(process.env.NEON_DATABASE_URL);
export const pool = new Pool({ connectionString: NEON_DATABASE_URL });

pool.on("error", (error: Error) => {
	logger.error(error);
});
