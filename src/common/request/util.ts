import * as v from "valibot";

/**
 * 検証を必ず失敗させるスキーマ
 */
export const NeverSchema = v.custom(() => false);

/**
 * 単体バリデーション
 */
export const validate1 = <TInput, TOutput>(
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
