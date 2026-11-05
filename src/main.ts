import { Notice, Plugin, TFile } from 'obsidian';
import { ExportError } from 'obsidian-citation-core';
import { chooseScreen, Presentation } from './commands/presentation';
import { renderTalk } from './commands/render';
import { loadSettings, type Settings } from './core/settings';
import { SettingsTab } from './ui/settings-tab';
import { decorate, undecorate } from './ui/title-bar';
import { PREVIEW_VIEW, PreviewView } from './ui/preview';
import { NOTES_VIEW, NotesView, SLIDESHOW_VIEW, SlideshowView } from './ui/views';

export default class TakeTheFloor extends Plugin {
	settings!: Settings;
	private presentation: Presentation | null = null;
	/** While a note is on its way to pandoc, so a second press doesn't start a second talk. */
	private starting = false;
	private unloaded = false;
	private decorating = 0;

	async onload() {
		this.settings = loadSettings(await this.loadData());
		this.addSettingTab(new SettingsTab(this.app, this));

		this.registerView(SLIDESHOW_VIEW, (leaf) => new SlideshowView(leaf, () => this.presentation));
		this.registerView(NOTES_VIEW, (leaf) => new NotesView(leaf, () => this.presentation));
		this.registerView(PREVIEW_VIEW, (leaf) => new PreviewView(leaf, (file, first) => renderTalk(this, file, { download: first, missing: false })));

		// Obsidian brings a window back on the next launch, and a talk doesn't come back with it.
		this.app.workspace.onLayoutReady(() => {
			for (const type of [SLIDESHOW_VIEW, NOTES_VIEW, PREVIEW_VIEW]) {
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
		this.addCommand({
			id: 'preview',
			name: 'Preview slides',
			checkCallback: (checking) => {
				const file = this.app.workspace.getActiveFile();
				if (file?.extension !== 'md') return false;
				if (!checking) this.attempt(this.preview(file));
				return true;
			},
		});
		during('next-slide', 'Next slide', (talk) => talk.move(1));
		during('previous-slide', 'Previous slide', (talk) => talk.move(-1));
		during('blank', 'Blank the screen', (talk) => talk.toggleBlank());
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

		// The title bar follows the note: a view rebuilds its actions when it
		// switches between editing and reading, and a note's properties are in what
		// the metadata cache says.
		this.registerEvent(this.app.workspace.on('layout-change', () => this.decorate()));
		this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.decorate()));
		this.registerEvent(this.app.workspace.on('file-open', () => this.decorate()));
		this.registerEvent(this.app.metadataCache.on('changed', () => this.decorate()));
		this.app.workspace.onLayoutReady(() => this.decorate());
	}

	onunload() {
		this.unloaded = true;
		undecorate(this.app);
		// A slideshow left behind would have nothing to show, and nothing to end it.
		this.presentation?.end();
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Deferred, because `layout-change` fires before a view rebuilds its
	 * actions, and coalesced, because opening a note fires several events in a
	 * row. On this window's own timer: Obsidian's `debounce` was seen to stop
	 * for good when a talk ended, which closes the window that was active.
	 */
	private decorate(): void {
		window.clearTimeout(this.decorating);
		this.decorating = window.setTimeout(() => {
			if (!this.unloaded) decorate(this.app, (file) => this.present(file), this.presentation !== null);
		}, 20);
	}

	/** The tab with a note's slides, beside the note, the same tab if it's open already. */
	private async preview(file: TFile): Promise<void> {
		const leaf = this.app.workspace.getLeavesOfType(PREVIEW_VIEW)[0] ?? this.app.workspace.getLeaf('split', 'vertical');
		await leaf.setViewState({ type: PREVIEW_VIEW, active: false });
		await this.app.workspace.revealLeaf(leaf);
		if (leaf.view instanceof PreviewView) await leaf.view.showNote(file);
	}

	private present(file: TFile) {
		if (this.starting || this.presentation !== null) return;
		this.starting = true;
		this.attempt(
			(async () => {
				const slides = await renderTalk(this, file);
				if (slides === null) return;
				const where = await chooseScreen(this.app);
				if (where === null) return;
				this.presentation = new Presentation(this.app, slides, file.path, where.places, where.screen, () => {
					this.presentation = null;
					this.decorate();
				});
				this.decorate();
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
