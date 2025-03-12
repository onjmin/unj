import * as v from "valibot";

/**
 * 検証を必ず失敗させるスキーマ
 */
export const NeverSchema = v.custom(() => false);

/**
 * 1つ目のエラーメッセージだけを返したいとき
 * safeParseよりもシンプルな関数
 */
export const getFirstError = <TInput, TOutput>(
	schema: v.BaseSchema<TInput, TOutput, v.BaseIssue<unknown>>,
	input: TInput,
) => {
	const result = v.safeParse(schema, input, {
		abortPipeEarly: true,
	});
	if (result.issues !== undefined) {
		const issue = v.flatten(result.issues);
		if (issue.root !== undefined) {
			return issue.root[0];
		}
	}
	return "";
};
