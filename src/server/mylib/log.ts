import chalk from "chalk";

export const logInfo = (message: string): void => {
	console.log(chalk.bgBlue.white(message));
};

export const logWarning = (message: string): void => {
	console.warn(chalk.bgYellow.black(message));
};

export const logError = (message: string): void => {
	console.error(chalk.bgRed.white(message));
};
