export const sleep = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));

export const randArray = (arr: string[]) =>
	arr[Math.floor(Math.random() * arr.length)];
