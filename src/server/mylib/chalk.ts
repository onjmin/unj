export const chalk = {
	green: (s: string) => `\x1b[32m${s}\x1b[0m`,
	gray: (s: string) => `\x1b[90m${s}\x1b[0m`,
	bgRedWhite: (s: string) => `\x1b[41m\x1b[37m${s}\x1b[0m`,
	bgYellowBlack: (s: string) => `\x1b[43m\x1b[30m${s}\x1b[0m`,
};
