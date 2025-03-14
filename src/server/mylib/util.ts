export const sleep = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));

const _f = (max: number) => (max * Math.random()) | 0;
export const randInt = (min: number, max: number) =>
	_f(Math.abs(max - min + 1)) + min;
export const randArray = <T>(array: T[]): T => array[_f(array.length)];
