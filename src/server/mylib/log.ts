import * as winston from "winston";
import "winston-daily-rotate-file";
import path from "node:path";
import { format } from "date-fns";
import { PROD_MODE, ROOT_PATH } from "../mylib/env.js";

const filename = path.resolve(ROOT_PATH, "log", "%DATE%.log");
const transport = new winston.transports.DailyRotateFile({
	filename,
	datePattern: "YYYY-MM-DD",
	zippedArchive: false,
	maxFiles: "3d", // 3 days
	maxSize: "2m", // 2MB
});

export const logger = winston.createLogger({
	level: PROD_MODE ? "error" : "debug",
	format: winston.format.combine(
		winston.format.errors({ stack: true }),
		winston.format.printf((info) => {
			const time = format(new Date(), "HH:mm:ss");
			const level = info.level.toUpperCase();
			const message = info.stack || info.message;
			return `[${time}] ${level}: ${message}`;
		}),
	),
	transports: [transport],
});
