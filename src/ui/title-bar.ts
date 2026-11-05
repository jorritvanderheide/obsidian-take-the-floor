// A Present button in the title bar of a note that looks like slides.
//
// Wiring only: what looks like slides is core/talk.ts's to say.
import { MarkdownView, setIcon, type App, type TFile } from 'obsidian';
import { looksLikeSlides } from '../core/talk';

const BUTTON = 'take-the-floor-present';

/**
 * Obsidian has no way to put an action on every markdown view, so this walks
 * the open ones. Whether a view has its button is asked of the DOM: switching
 * between editing and reading rebuilds a view's actions, and throws this away
 * with them.
 */
export function decorate(app: App, present: (file: TFile) => void, presenting: boolean): void {
	for (const leaf of app.workspace.getLeavesOfType('markdown')) {
		if (!(leaf.view instanceof MarkdownView)) continue;
		const view = leaf.view;
		let button = view.containerEl.querySelector<HTMLElement>(`.${BUTTON}`);
		if (!button) {
			// Reads the view when it's clicked: a view outlives the notes shown in it.
			button = view.addAction('presentation', 'Present', () => {
				if (view.file) present(view.file);
			});
			button.addClass(BUTTON);
			// A word with its mark, the way In the Open shows a post's status.
			button.empty();
			setIcon(button.createSpan({ cls: 'take-the-floor-present-icon' }), 'presentation');
			button.createSpan({ text: 'Present' });
		}
		const file = view.file;
		button.toggle(!presenting && file !== null && looksLikeSlides(app.metadataCache.getFileCache(file)?.sections));
	}
}

/** Take the buttons back out, so unloading the plugin leaves no trace. */
export function undecorate(app: App): void {
	for (const leaf of app.workspace.getLeavesOfType('markdown')) {
		if (leaf.view instanceof MarkdownView) leaf.view.containerEl.querySelector(`.${BUTTON}`)?.remove();
	}
}
