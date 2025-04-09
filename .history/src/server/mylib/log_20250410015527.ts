import * as winston from "winston";
import "winston-daily-rotate-file";
import path from "node:path";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { PROD_MODE, ROOT_PATH } from "./env.js";
import { toZonedTime } from "date-fns-tz";

export const levels = [
	"error",
	"warn",
	"info",
	"http",
	"verbose",
	"debug",
	"silly",
	"*",
];

const filename = path.resolve(ROOT_PATH, "logs", "%DATE%.log");
const transport = new winston.transports.DailyRotateFile({
	filename,
	datePattern: "YYYY-MM-DD",
	zippedArchive: false,
	maxFiles: "3d", // 3 days
	maxSize: "2m", // 2MB
});

export const logger = winston.createLogger({
	level: PROD_MODE ? "info" : "debug",
	format: winston.format.combine(
		winston.format.errors({ stack: true }),
		winston.format.printf((info) => {
			const zonedDate =  toZonedTime(new Date(), " 	

America/New_York");
			const time = format(zonedDate, "HH:mm:ss.SSS", { locale: ja });
			const level = info.level.toUpperCase();
			const message = info.stack || info.message;
			return JSON.stringify([time, level, message]);
		}),
	),
	transports: [transport],
});
