// A note as a talk: read it, run pandoc, and pair the slides with the notes.
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { homedir } from 'os';
import { basename, dirname } from 'path';
import { FileSystemAdapter, MarkdownView, Notice, parseYaml, requestUrl, type App, type TFile } from 'obsidian';
import {
	bibKeys,
	BUILT_IN,
	builtInFolder,
	ExportError,
	lineBreaks,
	missingBibliography,
	missingStyle,
	noteStyle,
	pandocFor,
	prepare,
	seen,
	settingPath,
	slideArgs,
	slidesOf,
	stylePath,
	withFiles,
	type Missing,
	type Pandoc,
	type Vault,
} from 'obsidian-citation-core';
import { withNotes, type Slide } from '../core/talk';
import { confirm } from '../ui/confirm';
import type { Context } from '../context';

/** Where pandoc's path is set, for the core's message when pandoc isn't there. */
const SETTINGS = 'Settings → Take the Floor';

/** What rendering may stop and ask you. A preview that updates as you type asks nothing. */
export interface Asks {
	/** Whether to offer the built-in pandoc when there's none. */
	download: boolean;
	/** Whether to list citations about to be lost, and to pass on what pandoc says. */
	missing: boolean;
	/** The button that goes ahead with lost citations. */
	anyway?: string;
}

/**
 * The slides of a note, or null when you decided against it. Everything that
 * can go wrong goes wrong here, before a window opens in front of anybody.
 */
export async function renderTalk(context: Context, file: TFile, asks: Asks = { download: true, missing: true }): Promise<Slide[] | null> {
	const { app, settings } = context;
	const adapter = app.vault.adapter;
	if (!(adapter instanceof FileSystemAdapter)) throw new ExportError('Presenting needs the desktop app.');
	const vault = adapter.getBasePath();
	const home = homedir();

	const bibliography = settings.bibliography ? settingPath(settings.bibliography, vault, home) : null;
	if (bibliography && !existsSync(bibliography)) throw new ExportError(missingBibliography(bibliography, 'present'));
	const csl = settings.csl ? stylePath(settings.csl, home) : null;
	if (csl && !existsSync(csl)) throw new ExportError(missingStyle(csl));

	const pandoc = await pandocToRun(app, settings.pandocPath, vault, asks.download);
	if (pandoc === null) return null;
	// Once a session, for a pandoc that turns some citations into text.
	if (pandoc.notice && asks.missing) new Notice(pandoc.notice, 0);

	// The editor rather than the file when the note is open, since the file can
	// be a couple of seconds behind what you just typed.
	const view = app.workspace.getActiveViewOfType(MarkdownView);
	const text = view?.file === file ? view.editor.getValue() : await app.vault.read(file);
	const deck = slidesOf(text);
	const lookup: Vault = {
		resolve: (linkpath) => {
			const dest = app.metadataCache.getFirstLinkpathDest(linkpath, file.path);
			if (!dest) return null;
			// As the window that shows it finds it: pandoc only passes this along.
			return { path: dest.path, file: app.vault.getResourcePath(dest), frontmatter: app.metadataCache.getFileCache(dest)?.frontmatter };
		},
		parseYaml: (yaml) => {
			try {
				return parseYaml(yaml) as unknown;
			} catch {
				throw new ExportError(`The properties of ${file.basename} have a mistake in them, so Take the Floor can't present it. Open the note in source mode, where Obsidian shows what's wrong.`);
			}
		},
	};
	const keys = bibliography ? bibKeys(await readFile(bibliography, 'utf8')) : null;
	const { markdown, metadata, missing } = prepare(deck.text, lookup, {
		name: file.basename,
		papersFolder: settings.literatureFolder,
		keyProperty: settings.keyProperty,
		keys,
		noteStyle: csl !== null && noteStyle(await readFile(csl, 'utf8')),
		slides: true,
	});
	const lost = missing.papers.length + missing.unresolved.length;
	if (asks.missing && keys !== null && bibliography && lost > 0 && !(await confirmMissing(context, missing, lost, basename(bibliography), asks.anyway ?? 'Present anyway'))) return null;

	let appConfig: unknown = null;
	try {
		appConfig = JSON.parse(await adapter.read(`${app.vault.configDir}/app.json`));
	} catch {
		// No app.json, or one that does not parse: Obsidian's defaults.
	}

	const progress = asks.missing ? new Notice('Getting your slides ready…', 0) : null;
	let warnings: string;
	let html: string;
	try {
		[warnings, html] = await withFiles(metadata, async (files) => {
			const said = await pandoc.run(
				slideArgs(
					seen(
						{
							...files,
							bibliography,
							csl,
							resourcePath: [vault, dirname(adapter.getFullPath(file.path))].map((dir) => pandoc.see(dir)).join(pandoc.delimiter),
							hardLineBreaks: lineBreaks(appConfig),
							output: files.slideshow,
						},
						(host) => pandoc.see(host),
					),
				),
				markdown,
			);
			return [said, await readFile(files.slideshow, 'utf8')] as const;
		});
	} finally {
		progress?.hide();
	}
	if (warnings && asks.missing) new Notice(warnings, 10000);

	const page = new DOMParser().parseFromString(html, 'text/html');
	const made = Array.from(page.body.querySelectorAll(':scope > .slide')).map((slide) => ({ html: slide.outerHTML, closing: slide.classList.contains('references') }));
	const slides = withNotes(made, deck.notes);
	if (slides === null) {
		throw new ExportError(`Take the Floor found ${deck.notes.length} slides in ${file.basename}, and pandoc made a different number, so your notes could show over the wrong slide. This usually means a line of --- inside an HTML block, which can't end a slide. Move it out of the block. If there's none, this is a bug: please open an issue with the note.`);
	}
	return slides;
}

/**
 * The pandoc the **Pandoc** setting asks for. Without an installed one, the
 * built-in one, which is asked about and downloaded the first time; null when
 * that's declined.
 */
async function pandocToRun(app: App, setting: string, vault: string, ask: boolean): Promise<Pandoc | null> {
	let downloading: Notice | null = null;
	try {
		return await pandocFor(
			setting,
			vault,
			SETTINGS,
			async () => {
				if (!ask) return false;
				const yes = await confirm(
					app,
					'Download pandoc?',
					(el) => {
						el.createEl('p', { text: "Take the Floor uses pandoc to turn a note into slides, and it can't find pandoc on this computer." });
						el.createEl('p', {
							text: `It can download pandoc ${BUILT_IN.version} for you, from pandoc's release on GitHub. It's a ${BUILT_IN.megabytes} MB download, kept in ${builtInFolder()}, outside your vault. This copy runs inside Obsidian.`,
						});
						el.createEl('p', {
							text: "You can also cancel and install pandoc yourself. If it's installed already, set its full path in the Take the Floor settings, and try again.",
						});
					},
					'Download',
				);
				if (yes) downloading = new Notice(`Downloading pandoc ${BUILT_IN.version}…`, 0);
				return yes;
			},
			async (url) => (await requestUrl({ url })).arrayBuffer,
		);
	} catch (error) {
		if (error instanceof ExportError) throw error;
		throw new ExportError(`Couldn't download pandoc: ${error instanceof Error ? error.message : String(error)}. Try again, or install pandoc.`);
	} finally {
		(downloading as Notice | null)?.hide();
	}
}

function confirmMissing(context: Context, missing: Missing, count: number, bib: string, anyway: string): Promise<boolean> {
	const one = (keys: string[]) => keys.length === 1;
	const list = (el: HTMLElement, keys: string[]) => {
		const ul = el.createEl('ul');
		for (const key of keys) ul.createEl('li').createEl('code', { text: key });
	};
	return confirm(
		context.app,
		count === 1 ? "A link isn't in the bibliography" : `${count} links aren't in the bibliography`,
		(el) => {
			if (missing.papers.length > 0) {
				el.createEl('p', {
					text: one(missing.papers)
						? `This links to a paper that ${bib} doesn't have, so it'll show as plain text instead of a citation:`
						: `These link to papers that ${bib} doesn't have, so they'll show as plain text instead of citations:`,
				});
				list(el, missing.papers);
				el.createEl('p', {
					text: `Usually Better BibTeX changed the key, or its auto-export hasn't run since you added the paper. A paper note without a ${context.settings.keyProperty} property is looked up by its name, so it only cites when it's named for its key.`,
				});
			}
			if (missing.unresolved.length > 0) {
				el.createEl('p', {
					text: one(missing.unresolved)
						? `This doesn't link to a note, and ${bib} has no key by its name either. It'll show as plain text:`
						: `These don't link to a note, and ${bib} has no keys by their names either. They'll show as plain text:`,
				});
				list(el, missing.unresolved);
				el.createEl('p', {
					text: "A link to a note you haven't written yet ends up here, and that's fine. So does a paper you cited by its key before Better BibTeX's auto-export added it.",
				});
			}
		},
		anyway,
	);
}
