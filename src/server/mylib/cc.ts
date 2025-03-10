import { encodeUserId } from "./anti-debug.js";

export const makeCcUserId = (ccBitmask: number, userId: number) => {
	if ((ccBitmask & 2) === 1) {
		// 2: 自演防止ID表示 # （ID:8z.8u.L60）
		const result = encodeUserId(userId, new Date());
		if (result !== null) {
			// 「IDの最初の2文字」「プロパイダを基にした文字」「忍法帖レベル」
			// TODO
		}
	} else if ((ccBitmask & 1) === 1) {
		// 1: ID表示 # （ID:byNL）
		const result = encodeUserId(userId, new Date());
		if (result !== null) {
			return result.slice(0, 4);
		}
	}
	// 0: ID非表示
	return "???";
};

export const unjDefaultUserName = "月沈めば名無し";

/**
 * 名前に付加される系のコマンドもここで作成する
 */
export const makeCcUserName = (ccBitmask: number, userName: string) => {
	if ((ccBitmask & 4) === 1) {
		return userName;
	}
	return "";
};

export const makeCcUserAvatar = (ccBitmask: number, userAvatar: number) => {
	if ((ccBitmask & 8) === 1) {
		return userAvatar;
	}
	return 0;
};
