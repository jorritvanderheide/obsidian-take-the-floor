// Which screen, when there's more than one to choose from.
import { SuggestModal, type App } from 'obsidian';
import type { Screen } from '../core/screens';

class ScreenPicker extends SuggestModal<Screen> {
	private chosen: Screen | null = null;

	constructor(
		app: App,
		private readonly screens: Screen[],
		private readonly done: (screen: Screen | null) => void,
	) {
		super(app);
		this.setPlaceholder('Which screen should show the slides?');
	}

	getSuggestions(query: string): Screen[] {
		return this.screens.filter((screen) => screen.label.toLowerCase().includes(query.toLowerCase()));
	}

	renderSuggestion(screen: Screen, el: HTMLElement): void {
		el.setText(screen.label);
	}

	onChooseSuggestion(screen: Screen): void {
		this.chosen = screen;
	}

	onClose(): void {
		// After the choice: Obsidian closes the modal before it reports one.
		window.setTimeout(() => this.done(this.chosen), 0);
	}
}

/** The screen you chose, or null when you backed out. */
export function pickScreen(app: App, screens: Screen[]): Promise<Screen | null> {
	return new Promise((resolve) => new ScreenPicker(app, screens, resolve).open());
}
