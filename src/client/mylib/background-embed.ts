let userActionDone = false;

/**
 * 初回遷移時、ユーザーの初回タップがなければ自動再生不可
 */
const handleUserAction = (callback: () => void) => {
	if (userActionDone) return;
	const play = () => {
		userActionDone = true;
		callback();
		window.removeEventListener("click", play);
		window.removeEventListener("touchstart", play);
	};
	window.addEventListener("click", play);
	window.addEventListener("touchstart", play);
};

export let activeController: Controller | null = null;
export const clearActiveController = () => {
	activeController = null;
};

type Controller = {
	target: any | null;
	play(): void;
	pause(): void;
};
type NicovideoController = Controller & {
	origin: string;
	post(data: object): void;
};
const youTubeController = new (class implements Controller {
	target: any | null = null;
	play() {
		this.target?.setVolume(64);
		this.target?.playVideo();
		this.target?.setLoop(true);
	}
	pause() {
		this.target?.pauseVideo();
	}
})();
const nicovideoController = new (class implements NicovideoController {
	target: HTMLIFrameElement | null = null;
	origin = "https://embed.nicovideo.jp";
	play() {
		this.post({
			eventName: "volumeChange",
			data: { volume: 96 / 100 },
		});
		this.post({ eventName: "play" });
	}
	pause() {
		this.post({ eventName: "pause" });
	}
	post(data: object) {
		this.target?.contentWindow?.postMessage(
			Object.assign(
				{
					sourceConnectorType: 1,
				},
				data,
			),
			this.origin,
		);
	}
})();
const soundCloudController = new (class implements Controller {
	target: any | null = null;
	play() {
		this.target?.setVolume(64);
		this.target?.play();
	}
	pause() {
		this.target?.pause();
	}
})();

declare global {
	var YT: any;
	var onYouTubeIframeAPIReady: () => void;
}
export const embedYouTube = ({
	iframeParentDOM,
	embedUrl,
	width,
	height,
}: {
	iframeParentDOM: Element | null;
	embedUrl: string;
	width: number;
	height: number;
}) => {
	if (!iframeParentDOM) return;
	activeController = youTubeController;
	const videoId = embedUrl.split("/").slice(-1)[0];
	const onYouTubeIframeAPIReady = () => {
		new window.YT.Player(iframeParentDOM, {
			width,
			height,
			videoId,
			playerVars: {
				loop: 1,
				playlist: videoId,
			},
			events: {
				onReady: (event: any) => {
					youTubeController.target = event.target;
					youTubeController.play();
				},
				onError: console.error,
			},
		});
	};
	if (window.YT) setTimeout(onYouTubeIframeAPIReady);
	else {
		window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
		handleUserAction(() => youTubeController.play());
	}
};
export const embedNicovideo = ({
	iframeDOM,
}: { iframeDOM: HTMLIFrameElement | null }) => {
	if (!iframeDOM) return;
	activeController = nicovideoController;
	nicovideoController.target = iframeDOM;
	const handle = (e: MessageEvent) => {
		if (e.origin !== nicovideoController.origin) return;
		const { data } = e.data;
		switch (e.data.eventName) {
			case "playerStatusChange": {
				switch (data.playerStatus) {
					case 4:
						nicovideoController.play();
						break;
				}
				break;
			}
			case "loadComplete": {
				nicovideoController.play();
				break;
			}
		}
	};
	window.removeEventListener("message", handle);
	window.addEventListener("message", handle);
	handleUserAction(() => nicovideoController.play());
};
declare global {
	var SC: any;
}
export const embedSoundCloud = ({
	iframeDOM,
}: { iframeDOM: HTMLIFrameElement | null }) => {
	if (!iframeDOM) return;
	activeController = soundCloudController;
	const ready = () => {
		soundCloudController.target = window.SC.Widget(iframeDOM);
		soundCloudController.target?.bind(window.SC.Widget.Events.READY, () =>
			soundCloudController.play(),
		);
		soundCloudController.target?.bind(window.SC.Widget.Events.FINISH, () =>
			soundCloudController.play(),
		);
		soundCloudController.target?.bind(
			window.SC.Widget.Events.ERROR,
			console.error,
		);
	};
	if (window.SC?.Widget) setTimeout(ready);
	else {
		const id = setInterval(() => {
			if (!window.SC?.Widget) return;
			clearInterval(id);
			ready();
			handleUserAction(() => soundCloudController.play());
		}, 512);
	}
};
