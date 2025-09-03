/**
 * GitHubのデプロイ履歴を取得する関数
 */
export const fetchGitHubDeployments = (url: string) => {
	const controller = new AbortController();
	const signal = controller.signal;

	const promise = fetch(url, { signal })
		.then((res) => (res.ok ? res.json() : []))
		.then((json) => (Array.isArray(json) ? (json as Deployment[]) : []))
		.catch(() => []);

	return {
		controller,
		promise,
	};
};

type GitHubUser = {
	login: string;
	id: number;
	node_id: string;
	avatar_url: string;
	gravatar_id: string;
	url: string;
	html_url: string;
	followers_url: string;
	following_url: string;
	gists_url: string;
	starred_url: string;
	subscriptions_url: string;
	organizations_url: string;
	repos_url: string;
	events_url: string;
	received_events_url: string;
	type: string;
	user_view_type: string;
	site_admin: boolean;
};

type DeploymentPayload = {
	app_id: string;
	app_name: string;
	deployment_id: string;
	organization_id: string;
	service_id: string;
	service_name: string;
};

type Deployment = {
	url: string;
	id: number;
	node_id: string;
	task: string;
	original_environment: string;
	environment: string;
	description: string;
	created_at: string;
	updated_at: string;
	statuses_url: string;
	repository_url: string;
	creator: GitHubUser;
	sha: string;
	ref: string;
	payload: DeploymentPayload;
	transient_environment: boolean;
	production_environment: boolean;
	performed_via_github_app: null; // 型が分からん
};
