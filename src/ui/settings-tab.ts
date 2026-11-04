import { existsSync } from 'fs';
import { homedir } from 'os';
import { FileSystemAdapter, PluginSettingTab, type App, type SettingDefinitionItem } from 'obsidian';
import { keyPropertyStatus, papersFolderStatus, settingPath, stylePath } from 'obsidian-citation-core';
import { loadSettings, type Settings } from '../core/settings';
import type TakeTheFloor from '../main';

export class SettingsTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: TakeTheFloor,
	) {
		super(app, plugin);
	}

	getControlValue(key: string): unknown {
		return this.plugin.settings[key as keyof Settings];
	}

	/** Write a value back through the loader, so what is stored is what it would read. */
	async setControlValue(key: string, value: unknown): Promise<void> {
		this.plugin.settings = loadSettings({ ...this.plugin.settings, [key]: value });
		await this.plugin.saveSettings();
		this.update();
	}

	/** A setting that must agree with something outside the plugin says when it does not. */
	private bibliographyStatus(): string {
		const value = this.plugin.settings.bibliography;
		const adapter = this.app.vault.adapter;
		if (value === '' || !(adapter instanceof FileSystemAdapter)) return '';
		const path = settingPath(value, adapter.getBasePath(), homedir());
		return existsSync(path) ? '' : ` ⚠ There's no file at ${path}, so presenting stops until you fix or clear this.`;
	}

	private cslStatus(): string {
		const value = this.plugin.settings.csl;
		if (value === '') return '';
		const path = stylePath(value, homedir());
		return existsSync(path) ? '' : ` ⚠ There's no citation style at ${path}.`;
	}

	private papersStatus(): string {
		const folder = this.plugin.settings.literatureFolder;
		if (folder === '') return '';
		const status = papersFolderStatus(this.app.vault.getMarkdownFiles().map((file) => file.path), folder);
		return status === null ? '' : ` ⚠ ${status}`;
	}

	// Said without a warning sign: naming paper notes for their keys works
	// without the property, and someone who does is not doing it wrong.
	private keyStatus(): string {
		const property = this.plugin.settings.keyProperty;
		if (property === '') return '';
		const status = keyPropertyStatus(this.app.vault.getMarkdownFiles().map((file) => this.app.metadataCache.getFileCache(file)?.frontmatter), property);
		return status === null ? '' : ` ${status}`;
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				type: 'group',
				heading: 'Pandoc',
				items: [
					{
						name: 'Pandoc',
						desc: "If you installed pandoc, this can usually stay pandoc. If Take the Floor doesn't find it, give its full path. Without pandoc installed, Take the Floor offers to download a copy that runs inside Obsidian.",
						control: { type: 'text', key: 'pandocPath', placeholder: 'pandoc' },
					},
				],
			},
			{
				type: 'group',
				heading: 'Citations',
				items: [
					{
						name: 'Bibliography',
						desc:
							'The .bib file that Better BibTeX’s auto-export keeps up to date. A link to one of its keys, like [[marsh2024]], shows as a citation on your slide, and any other link as its text. The file can be in your vault, or outside it with a path starting with / or ~. Leave it empty to present without citations.' +
							this.bibliographyStatus(),
						control: { type: 'text', key: 'bibliography', placeholder: 'Literature/library.bib' },
					},
					{
						name: 'Papers folder',
						desc: "The folder with your paper notes. Before you present, Take the Floor lists every link to a paper note whose key isn't in your bibliography, because it would show as plain text." + this.papersStatus(),
						control: { type: 'folder', key: 'literatureFolder', placeholder: 'Literature' },
					},
					{
						name: 'Citation key property',
						desc: 'The property that holds a paper note’s citation key. A link to a note with one cites that key, whatever the note is called. When Better BibTeX changes a key, your links keep working once the property has the new one. Paper Trail writes citekey.' + this.keyStatus(),
						control: { type: 'text', key: 'keyProperty', placeholder: 'citekey' },
					},
					{
						name: 'Citation style',
						desc: 'The name of a style Zotero has installed, such as apa or ieee, or the path to a .csl file. Leave it empty for Chicago author-date.' + this.cslStatus(),
						control: { type: 'text', key: 'csl', placeholder: 'Chicago author-date' },
					},
				],
			},
		];
	}
}
