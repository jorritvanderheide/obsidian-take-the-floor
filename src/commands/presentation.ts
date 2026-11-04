// A talk in progress: its two windows, its keys, and which slide it's on.
import { remote } from 'electron';
import { Scope, type App, type WorkspaceLeaf } from 'obsidian';
import { moved, type Slide } from '../core/talk';
import { NOTES_VIEW, SLIDESHOW_VIEW } from '../ui/views';

const NEXT = ['PageDown', 'ArrowRight', 'ArrowDown', ' '];
const PREVIOUS = ['PageUp', 'ArrowLeft', 'ArrowUp'];

export class Presentation {
	index = 0;
	private readonly listeners = new Set<() => void>();
	private readonly scope: Scope;
	private readonly blocker: number;
	private leaves: WorkspaceLeaf[] = [];
	private ended = false;

	/** The window with the slides, and the pane with the notes. Fixed from here on: editing the note changes nothing on the screen. */
	constructor(
		private readonly app: App,
		readonly slides: Slide[],
		readonly source: string,
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
		app.keymap.pushScope(this.scope);
		// A lock screen doesn't come up in front of the audience during a long answer.
		this.blocker = remote.powerSaveBlocker.start('prevent-display-sleep');
	}

	async open(): Promise<void> {
		const slideshow = this.app.workspace.openPopoutLeaf();
		this.leaves.push(slideshow);
		await slideshow.setViewState({ type: SLIDESHOW_VIEW, active: false });
		const notes = this.app.workspace.getLeaf('split', 'vertical');
		this.leaves.push(notes);
		await notes.setViewState({ type: NOTES_VIEW, active: true });
		// The main window, for the clicker and for you.
		this.app.workspace.setActiveLeaf(notes, { focus: true });
	}

	/** Called with every move, until the view that asked closes. */
	listen(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	move(step: number): void {
		const index = moved(this.index, step, this.slides.length);
		if (index === this.index) return;
		this.index = index;
		for (const listener of this.listeners) listener();
	}

	/** Ends the talk, from a key, a command, a button, or either window being closed. */
	end(): void {
		if (this.ended) return;
		this.ended = true;
		this.app.keymap.popScope(this.scope);
		remote.powerSaveBlocker.stop(this.blocker);
		this.finished();
		for (const leaf of this.leaves) leaf.detach();
	}
}
