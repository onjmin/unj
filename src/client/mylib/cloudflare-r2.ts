import { decodeEnv } from "./env.js";

const VITE_CLOUDFLARE_URL = decodeEnv(import.meta.env.VITE_CLOUDFLARE_URL);

const VITE_CLOUDFLARE_CLIENT_ID = decodeEnv(
	import.meta.env.VITE_CLOUDFLARE_CLIENT_ID,
);

// 許可する最大ファイルサイズ (2MB)
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// 画像の最大幅または高さ (1280px)
const MAX_DIMENSION = 1280;

export const getResizedBase64Image = async (
	previewUrl: string,
): Promise<string> => {
	// 1. 画像の読み込み
	const img = new Image();
	img.crossOrigin = "anonymous";

	// Promiseで画像の読み込み完了を待つ
	await new Promise<void>((resolve, reject) => {
		img.onload = () => resolve();
		img.onerror = () => reject(new Error("画像の読み込みに失敗しました。"));
		img.src = previewUrl;
	});

	const originalWidth = img.width;
	const originalHeight = img.height;
	let newWidth = originalWidth;
	let newHeight = originalHeight;
	let doResize = false;

	// 2. リサイズが必要かどうかの判定と新しいサイズ計算
	if (originalWidth > MAX_DIMENSION || originalHeight > MAX_DIMENSION) {
		doResize = true;

		// アスペクト比を維持しつつ、長い辺をMAX_DIMENSIONに合わせる
		if (originalWidth > originalHeight) {
			newHeight = Math.round(originalHeight * (MAX_DIMENSION / originalWidth));
			newWidth = MAX_DIMENSION;
		} else {
			newWidth = Math.round(originalWidth * (MAX_DIMENSION / originalHeight));
			newHeight = MAX_DIMENSION;
		}
	}

	// 3. Canvasへの描画
	const canvas = document.createElement("canvas");
	canvas.width = doResize ? newWidth : originalWidth;
	canvas.height = doResize ? newHeight : originalHeight;

	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas context could not be retrieved.");

	ctx.drawImage(img, 0, 0, newWidth, newHeight);

	// 4. Base64の取得とファイルサイズチェック
	// PNG形式でBase64データURLを取得 (品質指定は不要)
	const dataUrl = canvas.toDataURL("image/png"); // <-- PNGに変更

	// Base64プレフィックス 'data:image/png;base64,' を除去
	const base64Image = dataUrl.replace(/^[^,]+;base64,/, "");

	// Base64文字列の概算バイト数を計算 (Base64.length * 0.75)
	const binarySize = Math.floor(base64Image.length * 0.75);

	if (binarySize > MAX_FILE_SIZE) {
		// サイズ超過の警告
		const maxMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(1);
		const actualMB = (binarySize / 1024 / 1024).toFixed(1);
		throw new Error(
			`画像のファイルサイズが大きすぎます。リサイズ後も ${actualMB}MB で、許容最大サイズ (${maxMB}MB) を超えています。`,
		);
	}

	// プレフィックスなしのBase64文字列を返す
	return base64Image;
};

export const uploadCloudflareR2 = (base64: string) => {
	const image = base64.replace(/^[^,]+;base64,/, "");
	return fetch(VITE_CLOUDFLARE_URL, {
		method: "POST",
		headers: {
			Authorization: `Client-ID ${VITE_CLOUDFLARE_CLIENT_ID}`,
		},
		body: new URLSearchParams({ image }),
	});
};
