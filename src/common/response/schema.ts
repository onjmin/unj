export type HeadlineThread = {
	id: string;
	latest_res_at: Date;
	res_count: number;
	title: string;
	user_id: string;
	online: number;
	ikioi: number;
	lol_count: number;
	good_count: number;
	bad_count: number;
};

export type Res = {
	num: number;
	created_at: Date;
	cc_user_id: string;
	cc_user_name: string;
	cc_user_avatar: number;
	content: string;
	content_url: string;
	content_type: number;
};

export type Thread = {
	id: string;
	latest_res_at: Date;
	res_count: number;
	title: string;
	user_id: string;
	lol_count: number;
	good_count: number;
	bad_count: number;
	res_list: Res[];
	deleted_at: Date;
	ref_thread_id: string;
	ps: string;
	res_limit: number;
	age_res_num: number;
	sage: boolean;
	thread_type: number;
	cc_type: number;
	content_types_bitmask: number;
	banned: boolean;
	subbed: boolean;
};
