import { Notice, Plugin, TFile } from 'obsidian';
import { ExportError } from 'obsidian-citation-core';
import { Presentation } from './commands/presentation';
import { renderTalk } from './commands/render';
import { loadSettings, type Settings } from './core/settings';
import { SettingsTab } from './ui/settings-tab';
import { NOTES_VIEW, NotesView, SLIDESHOW_VIEW, SlideshowView } from './ui/views';

export default class TakeTheFloor extends Plugin {
	settings!: Settings;
	private presentation: Presentation | null = null;
	/** While a note is on its way to pandoc, so a second press doesn't start a second talk. */
	private starting = false;

	async onload() {
		this.settings = loadSettings(await this.loadData());
		this.addSettingTab(new SettingsTab(this.app, this));

		this.registerView(SLIDESHOW_VIEW, (leaf) => new SlideshowView(leaf, () => this.presentation));
		this.registerView(NOTES_VIEW, (leaf) => new NotesView(leaf, () => this.presentation));

		// Obsidian brings a window back on the next launch, and a talk doesn't come back with it.
		this.app.workspace.onLayoutReady(() => {
			for (const type of [SLIDESHOW_VIEW, NOTES_VIEW]) {
				for (const leaf of this.app.workspace.getLeavesOfType(type)) leaf.detach();
			}
		});

		this.addCommand({
			id: 'present',
			name: 'Present',
			checkCallback: (checking) => {
				const file = this.app.workspace.getActiveFile();
				if (file?.extension !== 'md' || this.presentation !== null) return false;
				if (!checking) this.present(file);
				return true;
			},
		});
		const during = (id: string, name: string, run: (talk: Presentation) => void) =>
			this.addCommand({
				id,
				name,
				checkCallback: (checking) => {
					if (this.presentation === null) return false;
					if (!checking) run(this.presentation);
					return true;
				},
			});
		during('next-slide', 'Next slide', (talk) => talk.move(1));
		during('previous-slide', 'Previous slide', (talk) => talk.move(-1));
		during('end', 'End presentation', (talk) => talk.end());

		this.addRibbonIcon('presentation', 'Present', () => {
			const file = this.app.workspace.getActiveFile();
			if (file?.extension === 'md' && this.presentation === null) this.present(file);
		});
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				if (!(file instanceof TFile) || file.extension !== 'md' || this.presentation !== null) return;
				menu.addItem((item) =>
					item
						.setTitle('Present')
						.setIcon('presentation')
						.setSection('action')
						.onClick(() => this.present(file)),
				);
			}),
		);
	}

	onunload() {
		// A slideshow left behind would have nothing to show, and nothing to end it.
		this.presentation?.end();
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private present(file: TFile) {
		if (this.starting) return;
		this.starting = true;
		this.attempt(
			(async () => {
				const slides = await renderTalk(this, file);
				if (slides === null) return;
				this.presentation = new Presentation(this.app, slides, file.path, () => {
					this.presentation = null;
				});
				await this.presentation.open();
			})().finally(() => {
				this.starting = false;
			}),
		);
	}

	/** Every failure becomes a notice. A rejection left unhandled is swallowed, and a command that failed looks like one that never started. */
	private attempt(done: Promise<void>) {
		done.catch((error: unknown) => {
			if (!(error instanceof ExportError)) console.error(error);
			new Notice(error instanceof Error ? error.message : String(error), 0);
			this.presentation?.end();
		});
	}
}
