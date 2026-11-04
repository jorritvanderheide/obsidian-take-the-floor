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
	export const remote: {
		powerSaveBlocker: {
			start(type: 'prevent-display-sleep'): number;
			stop(id: number): void;
		};
	};
}
