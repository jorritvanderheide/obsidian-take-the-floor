// A talk in progress: its two windows, its keys, and which slide it's on.
import { remote, type BrowserWindow } from 'electron';
import { Notice, type App, type EventRef, type WorkspaceLeaf } from 'obsidian';
import { screenToUse, type Screen } from '../core/screens';
import { keyAction, moved, type Slide } from '../core/talk';
import { pickScreen } from '../ui/screen-picker';
import { NOTES_VIEW, SLIDESHOW_VIEW } from '../ui/views';
import { placesHere, type Places } from './placement';

/** How long a screen that came back gets to settle: ten seconds, in steps. */
const RETURN_TRIES = 20;
const RETURN_WAIT = 500;
/** How long after your last change a blanked talk renders it again. */
const SETTLE = 800;

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
	private editorChange: EventRef | null = null;
	private fileChange: EventRef | null = null;
	private settling = 0;
	/** The newest render wins: a slower one that started earlier is dropped. */
	private latest = 0;
	private readonly blocker: number;
	private leaves: WorkspaceLeaf[] = [];
	private slideshow: BrowserWindow | null = null;
	private ended = false;
	/**
	 * Before anything else sees the key, with the capture flag. A Scope can't do this:
	 * an editor that takes the focus puts its own on top, and the keys go into the note.
	 * A dialog or menu you opened keeps its keys, wherever its focus is.
	 */
	private readonly onKey = (event: KeyboardEvent) => {
		if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
		// Obsidian's own handler comes first: it may just have closed a dialog with this key.
		if (event.defaultPrevented) return;
		// In either window: one opens in whichever was active.
		if ([document, this.slideshowWindow?.document].some((doc) => doc?.querySelector('.modal-container, .menu'))) return;
		// A key held down does one thing. So holding Esc can't reveal and then end, and
		// holding B doesn't go on to type into the note it just released.
		if (event.repeat) {
			if (keyAction(event.key, false) !== null && (!this.blank || keyAction(event.key, false) === 'hide' || keyAction(event.key, true) !== null)) {
				event.preventDefault();
				event.stopPropagation();
			}
			return;
		}
		const action = keyAction(event.key, this.blank);
		if (action === null) return;
		event.preventDefault();
		event.stopPropagation();
		if (action === 'next') this.move(1);
		else if (action === 'previous') this.move(-1);
		else if (action === 'end') this.end();
		else if (action === 'hide') this.hide();
		else if (action === 'reveal') void this.reveal();
		else this.slideshow?.setFullScreen(!this.slideshow.isFullScreen());
	};
	private slideshowWindow: Window | null = null;
	/** The screen the slideshow was put on, to tell it from another going away. */
	private placedOn: Screen | null = null;
	private revealing = false;
	private readonly screenRemoved = () => void this.lostScreen();
	private readonly screenAdded = () => void this.foundScreen();

	/** The window with the slides, and the pane with the notes. Editing the note changes nothing on the screen, unless you blank it first. */
	constructor(
		private readonly app: App,
		public slides: Slide[],
		readonly source: string,
		private readonly render: () => Promise<Slide[] | null>,
		private readonly places: Places | null,
		private readonly screen: Screen | null,
		private readonly finished: () => void,
	) {
		window.addEventListener('keydown', this.onKey, true);
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
		this.slideshowWindow = slideshow.getContainer().win;
		this.slideshowWindow.addEventListener('keydown', this.onKey, true);
		if (this.ended) return;
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
			this.placedOn = screen;
			await this.home(places);
		} catch (error) {
			console.error(error);
			this.say(moveFailed(error));
			await this.home(places);
		}
	}

	/** The cable came out. The window is on this screen now, and filling it would cover your notes. */
	private async lostScreen(): Promise<void> {
		if (!this.slideshow || !this.slideshow.isFullScreen()) return;
		// Some other screen going is none of the slideshow's business.
		const places = await placesHere().catch(() => null);
		if (places && (this.placedOn === null || places.others.some((screen) => screen.id === this.placedOn?.id))) return;
		this.slideshow.setFullScreen(false);
		this.say('The other screen is gone, so the slideshow is in a window here, on the same slide. It goes back when the screen does.');
		this.places?.lost(this.slideshow).catch((error: unknown) => console.error(error));
	}

	/**
	 * Back in, or plugged in for the first time when you started without it. A cable takes a while to settle: the screen can be announced
	 * before niri can use it, and niri moves the window back by itself on its own
	 * time. So this keeps trying until the slideshow fills that screen.
	 */
	private async foundScreen(): Promise<void> {
		let failure: unknown = null;
		let tried = false;
		for (let tries = 0; tries < RETURN_TRIES && !this.ended; tries++) {
			if (this.slideshow?.isFullScreen()) {
				this.say('');
				return;
			}
			try {
				const places = await placesHere();
				if (places === null) return;
				const screen = screenToUse(places.others);
				// With a choice to make, nobody asked for one in the middle of a talk.
				if (screen === 'ask') return;
				if (screen !== null) {
					tried = true;
					await this.place(places, screen);
				}
				failure = null;
			} catch (error) {
				failure = error;
			}
			await new Promise((resolve) => window.setTimeout(resolve, RETURN_WAIT));
		}
		if (this.ended || this.slideshow?.isFullScreen() || (!tried && failure === null)) return;
		console.error(failure);
		this.say(moveFailed(failure ?? "the screen is there, but it didn't take the window"));
	}

	/** Called with every move, until the view that asked closes. */
	listen(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	move(step: number): void {
		// Off a blank screen it only brings the same slide back, so the audience never misses one.
		if (this.blank) {
			void this.reveal();
			return;
		}
		const index = moved(this.index, step, this.slides.length);
		if (index === this.index) return;
		this.index = index;
		this.changed();
	}

	toggleBlank(): void {
		if (this.blank) void this.reveal();
		else this.hide();
	}

	/** Nothing for the room, and the note is yours to edit: what you change shows in your pane. */
	private hide(): void {
		this.blank = true;
		const edited = () => {
			window.clearTimeout(this.settling);
			this.settling = window.setTimeout(() => void this.refresh(), SETTLE);
		};
		this.editorChange = this.app.workspace.on('editor-change', (_editor, info) => {
			if (info.file?.path === this.source) edited();
		});
		this.fileChange = this.app.vault.on('modify', (file) => {
			if (file.path === this.source) edited();
		});
		this.changed();
	}

	/** The slides back, with your last changes in them: the screen stays blank until they're ready. */
	private async reveal(): Promise<void> {
		if (!this.blank || this.revealing) return;
		this.revealing = true;
		this.stopWatching();
		await this.refresh();
		this.revealing = false;
		if (this.ended || !this.blank) return;
		this.blank = false;
		this.changed();
	}

	private stopWatching(): void {
		window.clearTimeout(this.settling);
		// Each from what it was registered on: the wrong one ignores it without a word.
		if (this.editorChange) this.app.workspace.offref(this.editorChange);
		if (this.fileChange) this.app.vault.offref(this.fileChange);
		this.editorChange = null;
		this.fileChange = null;
	}

	/** The note as slides again. A mistake halfway through a line keeps the last ones that worked, and says so. */
	private async refresh(): Promise<void> {
		const mine = ++this.latest;
		try {
			const slides = await this.render();
			if (mine !== this.latest || this.ended || slides === null) return;
			this.slides = slides;
			this.index = Math.min(this.index, slides.length - 1);
			this.message = '';
		} catch (error) {
			if (mine !== this.latest || this.ended) return;
			console.error(error);
			this.message = `Your last change didn't work, so the slides stay as they were. (${error instanceof Error ? error.message : String(error)})`;
		}
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
		this.stopWatching();
		window.removeEventListener('keydown', this.onKey, true);
		this.slideshowWindow?.removeEventListener('keydown', this.onKey, true);
		remote.powerSaveBlocker.stop(this.blocker);
		remote.screen.removeListener('display-removed', this.screenRemoved);
		remote.screen.removeListener('display-added', this.screenAdded);
		this.finished();
		for (const leaf of this.leaves) leaf.detach();
	}
}
