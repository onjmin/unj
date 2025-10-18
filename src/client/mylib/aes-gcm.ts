// バイト配列(ArrayBuffer)をBase64URL文字列に変換する
const arrayBufferToBase64Url = (buffer: ArrayBuffer): string => {
	const bytes = new Uint8Array(buffer);
	let binary = "";
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	// Base64エンコード後、URLセーフな形式に変換
	return btoa(binary)
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
};

// Base64URL文字列をバイト配列(ArrayBuffer)に変換する
const base64UrlToArrayBuffer = (base64url: string): ArrayBuffer => {
	// URLセーフな形式を通常のBase64に戻す
	let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
	// パディングを追加
	while (base64.length % 4) {
		base64 += "=";
	}

	const binary = atob(base64);
	const buffer = new ArrayBuffer(binary.length);
	const bytes = new Uint8Array(buffer);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return buffer;
};

// 鍵導出のパラメータ
const KEY_DERIVATION_PARAMS = {
	name: "PBKDF2",
	// 導出回数: 2048回
	iterations: 2048,
	// ハッシュ関数
	hash: "SHA-256",
};
const KEY_LENGTH = 256; // 256ビット鍵

/**
 * パスワードとソルトからAES-GCM用の鍵を導出する
 * @param password ユーザーのパスワード (文字列)
 * @param salt 鍵導出に使うソルト (ArrayBuffer)
 * @returns 秘密鍵 (CryptoKey)
 */
const deriveKey = async (
	password: string,
	salt: ArrayBuffer,
): Promise<CryptoKey> => {
	const passwordBuffer = new TextEncoder().encode(password);

	// 1. パスワードから「マスター鍵の元」をインポート (RawKey)
	const masterKey = await crypto.subtle.importKey(
		"raw",
		passwordBuffer,
		{ name: "PBKDF2" },
		false, // エクスポート不可
		["deriveKey"],
	);

	// 2. PBKDF2で最終的な秘密鍵を導出
	return crypto.subtle.deriveKey(
		{ ...KEY_DERIVATION_PARAMS, salt: salt },
		masterKey,
		{ name: "AES-GCM", length: KEY_LENGTH },
		false, // エクスポート不可
		["encrypt", "decrypt"],
	);
};

// IV (Initialization Vector) と Salt のバイト長
const IV_LENGTH = 12; // AES-GCMでは一般的に12バイト（96ビット）
const SALT_LENGTH = 16; // 16バイト (128ビット)
const TAG_LENGTH = 16; // 認証タグは通常16バイト（128ビット）

/**
 * AES-GCMで平文を暗号化し、Base64URL形式で連結された文字列を返す
 * 形式: {salt}.{auth_tag}.{iv}.{ciphertext}
 * @param plaintext 暗号化したい平文 (文字列)
 * @param password ユーザーのパスワード (文字列)
 * @returns 連結された暗号文文字列
 */
export const encrypt = async (
	plaintext: string,
	password: string,
): Promise<string> => {
	// 1. IVとSaltの生成
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
	const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

	// 2. 鍵導出 (PBKDF2)
	const key = await deriveKey(password, salt.buffer);

	// 3. 暗号化 (AES-GCM)
	const plaintextBuffer = new TextEncoder().encode(plaintext);
	const algorithm: AesGcmParams = {
		name: "AES-GCM",
		iv: iv,
	};

	const encryptedData = await crypto.subtle.encrypt(
		algorithm,
		key,
		plaintextBuffer,
	);

	// 4. データの分割と連結
	// Web Crypto APIのAES-GCMの出力は {ciphertext + auth_tag} の形式
	const ciphertext = encryptedData.slice(
		0,
		encryptedData.byteLength - TAG_LENGTH,
	);
	const authTag = encryptedData.slice(encryptedData.byteLength - TAG_LENGTH);

	// 5. 連結: {salt}.{auth_tag}.{iv}.{ciphertext} の形式でBase64URLエンコードし連結
	const saltBase64 = arrayBufferToBase64Url(salt.buffer);
	const authTagBase64 = arrayBufferToBase64Url(authTag);
	const ivBase64 = arrayBufferToBase64Url(iv.buffer);
	const ciphertextBase64 = arrayBufferToBase64Url(ciphertext);

	return `${saltBase64}.${authTagBase64}.${ivBase64}.${ciphertextBase64}`;
};

/**
 * Base64URL形式の連結文字列をAES-GCMで復号し、平文を返す
 * 形式: {salt}.{auth_tag}.{iv}.{ciphertext}
 * @param encryptedText 連結された暗号文文字列
 * @param password ユーザーのパスワード (文字列)
 * @returns 復号された平文 (文字列)
 */
export const decrypt = async (
	encryptedText: string,
	password: string,
): Promise<string> => {
	// 1. 分割とデコード
	const parts = encryptedText.split(".");
	if (parts.length !== 4) {
		throw new Error(
			"Invalid encrypted message format. Expected 4 parts: {salt}.{auth_tag}.{iv}.{ciphertext}",
		);
	}

	// 順番: {salt}.{auth_tag}.{iv}.{ciphertext}
	const [saltBase64, authTagBase64, ivBase64, ciphertextBase64] = parts;

	try {
		const salt = base64UrlToArrayBuffer(saltBase64);
		const authTag = base64UrlToArrayBuffer(authTagBase64);
		const iv = base64UrlToArrayBuffer(ivBase64);
		const ciphertext = base64UrlToArrayBuffer(ciphertextBase64);

		// 認証タグと暗号文を結合して Web Crypto API の入力形式に戻す
		// APIのdecrypt関数は、入力の最後の16バイトを認証タグとして自動的に扱います
		const combinedBuffer = new Uint8Array(
			authTag.byteLength + ciphertext.byteLength,
		);
		combinedBuffer.set(new Uint8Array(ciphertext), 0);
		combinedBuffer.set(new Uint8Array(authTag), ciphertext.byteLength); // 末尾に認証タグを結合

		// 2. 鍵再生成 (PBKDF2)
		const key = await deriveKey(password, salt);

		// 3. 復号 (AES-GCM)
		const algorithm: AesGcmParams = {
			name: "AES-GCM",
			iv: iv,
		};

		const decryptedBuffer = await crypto.subtle.decrypt(
			algorithm,
			key,
			combinedBuffer.buffer, // {ciphertext + auth_tag} を入力
		);

		// 4. 平文の出力
		return new TextDecoder().decode(decryptedBuffer);
	} catch (error) {
		// 認証タグ不一致（鍵やパスワードが間違っている）の場合、復号処理が失敗しエラーをスローします
		console.error("Decryption failed:", error);
		throw new Error(
			"復号に失敗しました。パスワードまたは暗号文が正しくありません。",
		);
	}
};
