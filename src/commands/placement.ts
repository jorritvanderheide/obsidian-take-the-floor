// Getting the slideshow onto the other screen: through niri, through the window
// itself, or by your own hand. What to do is core/screens.ts's to say.
import { execFile } from 'child_process';
import { remote, type BrowserWindow } from 'electron';
import { otherOutputs, placeAbove, placing, windowTitled, type NiriOutput, type NiriWindow, type NiriWorkspace, type Screen } from '../core/screens';

/** How long the compositor has to say it has a window that was just opened. */
const FIND_TRIES = 30;
const FIND_WAIT = 100;
/** Focus can land a moment late, or be pulled back by the pointer. */
const FOCUS_TRIES = 6;
const FOCUS_WAIT = 150;

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export interface Places {
	/** Where the slideshow could go. */
	others: Screen[];
	/** Put the window on the screen and fill it. */
	place(slideshow: BrowserWindow, screen: Screen): Promise<void>;
	/** Give the focus back to Obsidian's main window, for you and the clicker. */
	home(): Promise<void>;
	/** Its screen is gone, and with it where the window was. */
	lost(slideshow: BrowserWindow): Promise<void>;
}

function niri(...args: string[]): Promise<string> {
	return new Promise((resolve, reject) => {
		execFile('niri', ['msg', ...args], (error, stdout, stderr) => {
			if (error) reject(new Error(stderr.trim() || error.message));
			else resolve(stdout);
		});
	});
}

async function niriJson<T>(what: string): Promise<T> {
	return JSON.parse(await niri('--json', what)) as T;
}

async function niriPlaces(): Promise<Places> {
	const main = remote.getCurrentWindow();
	const [windows, workspaces, outputs] = await Promise.all([niriJson<NiriWindow[]>('windows'), niriJson<NiriWorkspace[]>('workspaces'), niriJson<Record<string, NiriOutput>>('outputs')]);
	return {
		others: otherOutputs(outputs, workspaces, windowTitled(windows, main.getTitle())),
		place: async (slideshow, screen) => {
			let found: NiriWindow | null = null;
			for (let tries = 0; tries < FIND_TRIES && found === null; tries++) {
				found = windowTitled(await niriJson<NiriWindow[]>('windows'), slideshow.getTitle());
				if (found === null) await wait(FIND_WAIT);
			}
			if (found === null) throw new Error("niri doesn't list the window");
			await niri('action', 'move-window-to-monitor', '--id', String(found.id), screen.id);
			// In view on that screen, whatever else is open there.
			await niri('action', 'focus-window', '--id', String(found.id));
			// Through the window because niri's action is a toggle, and its list of
			// windows doesn't say which state a window is in.
			slideshow.setFullScreen(true);
		},
		lost: async (slideshow) => {
			const [now, spaces] = await Promise.all([niriJson<NiriWindow[]>('windows'), niriJson<NiriWorkspace[]>('workspaces')]);
			const found = windowTitled(now, slideshow.getTitle());
			const above = placeAbove(spaces, windowTitled(now, main.getTitle()));
			if (found && above !== null) await niri('action', 'move-window-to-workspace', '--window-id', String(found.id), '--focus', 'false', String(above));
		},
		home: async () => {
			for (let tries = 0; tries < FOCUS_TRIES; tries++) {
				// Niri can be a moment behind the title of the note you're on.
				const here = windowTitled(await niriJson<NiriWindow[]>('windows'), main.getTitle());
				if (here?.is_focused) return;
				if (here) await niri('action', 'focus-window', '--id', String(here.id));
				await wait(FOCUS_WAIT);
			}
		},
	};
}

function electronPlaces(): Places {
	const main = remote.getCurrentWindow();
	const here = remote.screen.getDisplayMatching(main.getBounds()).id;
	const displays = remote.screen.getAllDisplays().filter((display) => display.id !== here);
	return {
		others: displays.map((display, index) => ({ id: String(display.id), label: display.label || `Screen ${index + 2} (${display.bounds.width}×${display.bounds.height})` })),
		place: async (slideshow, screen) => {
			const display = displays.find((each) => String(each.id) === screen.id);
			if (!display) return;
			slideshow.setBounds(display.bounds);
			slideshow.setFullScreen(true);
			await Promise.resolve();
		},
		home: async () => {
			main.focus();
			await Promise.resolve();
		},
		lost: () => Promise.resolve(),
	};
}

/** The places the slideshow can go here, or null when only you can move it. */
export async function placesHere(): Promise<Places | null> {
	const how = placing({ niriSocket: process.env.NIRI_SOCKET, platform: process.platform, waylandDisplay: process.env.WAYLAND_DISPLAY });
	if (how === 'by hand') return null;
	return how === 'niri' ? niriPlaces() : electronPlaces();
}
