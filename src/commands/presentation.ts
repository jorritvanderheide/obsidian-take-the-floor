// A talk in progress: its two windows, its keys, and which slide it's on.
import { remote, type BrowserWindow } from 'electron';
import { Notice, Scope, type App, type WorkspaceLeaf } from 'obsidian';
import { screenToUse, type Screen } from '../core/screens';
import { stepped, type Slide } from '../core/talk';
import { pickScreen } from '../ui/screen-picker';
import { NOTES_VIEW, SLIDESHOW_VIEW } from '../ui/views';
import { placesHere, type Places } from './placement';

const NEXT = ['PageDown', 'ArrowRight', 'ArrowDown', ' '];
const PREVIOUS = ['PageUp', 'ArrowLeft', 'ArrowUp'];
/** How long a screen that came back gets to settle: ten seconds, in steps. */
const RETURN_TRIES = 20;
const RETURN_WAIT = 500;

/**
 * Where the slideshow goes, asked before anything opens: the places, the screen,
 * or null for the screen when it stays in a window here. Null when you backed out
 * of choosing.
 */
export async function chooseScreen(app: App): Promise<{ places: Places | null; screen: Screen | null } | null> {
	let places: Places | null;
	try {
		places = await placesHere();
	} catch (error) {
		console.error(error);
		new Notice(moveFailed(error), 0);
		return { places: null, screen: null };
	}
	if (places === null) return { places, screen: null };
	const choice = screenToUse(places.others);
	if (choice !== 'ask') return { places, screen: choice };
	const screen = await pickScreen(app, places.others);
	return screen === null ? null : { places, screen };
}

const BY_HAND = "Take the Floor can't move windows on this desktop. Drag the slideshow to the other screen, and press F to make it fill the screen.";

const moveFailed = (error: unknown) =>
	`Take the Floor couldn't move the slideshow to the other screen, so it stays in a window here. Drag it across, and press F to make it fill the screen. (${error instanceof Error ? error.message : String(error)})`;

export class Presentation {
	index = 0;
	/** Whether the screen shows nothing for now. */
	blank = false;
	/** When the clock started. */
	readonly startedAt = Date.now();
	/** The numbers of the slides that don't fit, once they've been measured. */
	tooLongSlides: number[] = [];
	/** What you need to know during the talk, in the notes pane: a notice can land in the slideshow's window, behind the slides and in front of nobody. */
	message = '';
	private readonly listeners = new Set<() => void>();
	private readonly scope: Scope;
	private readonly blocker: number;
	private leaves: WorkspaceLeaf[] = [];
	private slideshow: BrowserWindow | null = null;
	private ended = false;
	private readonly screenRemoved = () => this.lostScreen();
	private readonly screenAdded = () => void this.foundScreen();

	/** The window with the slides, and the pane with the notes. Fixed from here on: editing the note changes nothing on the screen. */
	constructor(
		private readonly app: App,
		readonly slides: Slide[],
		readonly source: string,
		private readonly places: Places | null,
		private readonly screen: Screen | null,
		private readonly finished: () => void,
	) {
		// With the app's own scope behind it, so your other hotkeys still work.
		// These keys are the slideshow's while it runs, wherever the cursor is: a
		// clicker that types into a note is the worst thing that can happen here.
		this.scope = new Scope(app.scope);
		const on = (keys: string[], run: () => void) => {
			for (const key of keys) {
				this.scope.register([], key, () => {
					run();
					return false;
				});
			}
		};
		on(NEXT, () => this.move(1));
		on(PREVIOUS, () => this.move(-1));
		on(['Escape'], () => this.end());
		// Some clickers have a button for this, which sends one of these.
		on(['b', 'B', '.'], () => this.toggleBlank());
		on(['f', 'F'], () => this.slideshow?.setFullScreen(!this.slideshow.isFullScreen()));
		app.keymap.pushScope(this.scope);
		// A lock screen doesn't come up in front of the audience during a long answer.
		this.blocker = remote.powerSaveBlocker.start('prevent-display-sleep');
		remote.screen.on('display-removed', this.screenRemoved);
		remote.screen.on('display-added', this.screenAdded);
	}

	async open(): Promise<void> {
		const before = remote.BrowserWindow.getAllWindows().map((window) => window.id);
		const slideshow = this.app.workspace.openPopoutLeaf();
		this.leaves.push(slideshow);
		await slideshow.setViewState({ type: SLIDESHOW_VIEW, active: false });
		this.slideshow = remote.BrowserWindow.getAllWindows().find((window) => !before.includes(window.id)) ?? null;

		// Beside the most recent note in the main window, wherever you pressed Present.
		const beside = this.app.workspace.getMostRecentLeaf(this.app.workspace.rootSplit);
		const notes = beside ? this.app.workspace.createLeafBySplit(beside, 'vertical') : this.app.workspace.getLeaf('split', 'vertical');
		this.leaves.push(notes);
		await notes.setViewState({ type: NOTES_VIEW, active: true });
		this.app.workspace.setActiveLeaf(notes, { focus: true });

		if (this.places === null) {
			this.say(BY_HAND);
			return;
		}
		if (this.screen !== null) await this.place(this.places, this.screen);
		else await this.home(this.places);
	}

	private say(message: string): void {
		this.message = message;
		this.changed();
	}

	private changed(): void {
		for (const listener of this.listeners) listener();
	}

	private async home(places: Places): Promise<void> {
		try {
			await places.home();
		} catch (error) {
			console.error(error);
		}
	}

	/** On the screen, and then the focus back here, for you and the clicker. A failure leaves the talk running in a window. */
	private async place(places: Places, screen: Screen): Promise<void> {
		if (!this.slideshow) return;
		try {
			await places.place(this.slideshow, screen);
			await this.home(places);
		} catch (error) {
			console.error(error);
			this.say(moveFailed(error));
			await this.home(places);
		}
	}

	/** The cable came out. The window is on this screen now, and filling it would cover your notes. */
	private lostScreen(): void {
		if (!this.slideshow || !this.slideshow.isFullScreen()) return;
		this.slideshow.setFullScreen(false);
		this.say('The other screen is gone, so the slideshow is in a window here, on the same slide. It goes back when the screen does.');
	}

	/**
	 * And back in. A cable takes a while to settle: the screen can be announced
	 * before niri can use it, and niri moves the window back by itself on its own
	 * time. So this keeps trying until the slideshow fills that screen.
	 */
	private async foundScreen(): Promise<void> {
		if (this.screen === null) return;
		let failure: unknown = null;
		for (let tries = 0; tries < RETURN_TRIES && !this.ended; tries++) {
			if (this.slideshow?.isFullScreen()) {
				this.say('');
				return;
			}
			try {
				const places = await placesHere();
				if (places === null) return;
				const screen = screenToUse(places.others);
				if (screen !== null && screen !== 'ask') {
					await this.place(places, screen);
				}
				failure = null;
			} catch (error) {
				failure = error;
			}
			await new Promise((resolve) => window.setTimeout(resolve, RETURN_WAIT));
		}
		if (this.ended || this.slideshow?.isFullScreen()) return;
		console.error(failure);
		this.say(moveFailed(failure ?? "the screen is there, but it didn't take the window"));
	}

	/** Called with every move, until the view that asked closes. */
	listen(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	move(step: number): void {
		const next = stepped({ index: this.index, blank: this.blank }, step, this.slides.length);
		if (next.index === this.index && next.blank === this.blank) return;
		this.index = next.index;
		this.blank = next.blank;
		this.changed();
	}

	toggleBlank(): void {
		this.blank = !this.blank;
		this.changed();
	}

	/** What measuring the slides found. */
	tooLong(numbers: number[]): void {
		this.tooLongSlides = numbers;
		this.changed();
	}

	/** Ends the talk, from a key, a command, a button, or either window being closed. */
	end(): void {
		if (this.ended) return;
		this.ended = true;
		this.app.keymap.popScope(this.scope);
		remote.powerSaveBlocker.stop(this.blocker);
		remote.screen.removeListener('display-removed', this.screenRemoved);
		remote.screen.removeListener('display-added', this.screenAdded);
		this.finished();
		for (const leaf of this.leaves) leaf.detach();
	}
}
