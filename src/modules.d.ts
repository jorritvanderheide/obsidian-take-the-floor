// The core's filters and font, bundled as text and bytes by esbuild: see
// `loader` in esbuild.config.mjs. Declared here because the core's own
// declarations are not part of what this plugin imports from it.
declare module '*.lua' {
	const source: string;
	export default source;
}

declare module '*.ttf' {
	const bytes: Uint8Array;
	export default bytes;
}

// Provided by Obsidian's Electron at runtime. Only what is used here.
declare module 'electron' {
	export interface Rectangle {
		x: number;
		y: number;
		width: number;
		height: number;
	}
	export interface Display {
		id: number;
		label: string;
		bounds: Rectangle;
	}
	export interface BrowserWindow {
		id: number;
		getTitle(): string;
		getBounds(): Rectangle;
		setBounds(bounds: Rectangle): void;
		isFullScreen(): boolean;
		setFullScreen(on: boolean): void;
		focus(): void;
	}
	export const remote: {
		BrowserWindow: { getAllWindows(): BrowserWindow[] };
		getCurrentWindow(): BrowserWindow;
		powerSaveBlocker: {
			start(type: 'prevent-display-sleep'): number;
			stop(id: number): void;
		};
		screen: {
			getAllDisplays(): Display[];
			getDisplayMatching(rect: Rectangle): Display;
			on(event: 'display-added' | 'display-removed', listener: () => void): void;
			removeListener(event: 'display-added' | 'display-removed', listener: () => void): void;
		};
	};
}
