// A note's slides as a PDF, one to a page, for sending round or for a room where
// the laptop can't connect. It needs nothing but Obsidian: no LaTeX.
import { realpathSync } from 'fs';
import { writeFile } from 'fs/promises';
import { basename } from 'path';
import { remote, shell } from 'electron';
import { FileSystemAdapter, Notice, type TFile } from 'obsidian';
import { ExportError, insideVault, withExtension } from 'obsidian-citation-core';
import { tooLongMessage, type Slide } from '../core/talk';
import { createStage, showOnStage, slidesTooLong, stageTooLong } from '../ui/stage';
import type { Context } from '../context';
import { renderTalk } from './render';

/** A slide's 1920 by 1080 pixels, in inches. Given here because `@page` in the stylesheet would change the page of every note Obsidian's own Export to PDF makes. */
const PAGE = { width: 20, height: 11.25 };

export async function exportPdf(context: Context, file: TFile): Promise<void> {
	const adapter = context.app.vault.adapter;
	if (!(adapter instanceof FileSystemAdapter)) throw new ExportError('Exporting needs the desktop app.');

	const slides = await renderTalk(context, file);
	if (slides === null) return;

	const answer = await remote.dialog.showSaveDialog({
		defaultPath: `${file.basename}.pdf`,
		filters: [{ name: 'PDF', extensions: ['pdf'] }],
		properties: ['showOverwriteConfirmation'],
	});
	if (answer.canceled || !answer.filePath) return;
	const output = withExtension(answer.filePath, 'pdf');
	// Nothing is written in the vault, as with Due Credit's exports.
	if (insideVault(adapter.getBasePath(), output, realpathSync)) {
		throw new ExportError(`${output} is inside your vault. Take the Floor doesn't save exports there, because it writes nothing in your vault. Please save it somewhere outside the vault.`);
	}

	const progress = new Notice(`Exporting ${basename(output)}…`, 0);
	let tooLong: number[];
	try {
		tooLong = await slidesTooLong(activeDocument.body, slides);
		await writeFile(output, await printed(slides));
	} finally {
		progress.hide();
	}
	exported(output, tooLongMessage(tooLong));
}

/** The slides as PDF bytes, printed from this window with everything else hidden. */
async function printed(slides: Slide[]): Promise<Uint8Array> {
	// Obsidian's print styles hide everything on the body without this class.
	const sheets = document.body.createDiv({ cls: 'print take-the-floor-print' });
	try {
		for (const slide of slides) {
			const stage = createStage(sheets);
			showOnStage(stage, slide.html);
			await stageTooLong(stage);
		}
		return await remote.getCurrentWebContents().printToPDF({ printBackground: true, pageSize: PAGE, margins: { top: 0, bottom: 0, left: 0, right: 0 } });
	} finally {
		sheets.remove();
	}
}

/** Say where the file went, with a way to open it, and what didn't fit. */
function exported(output: string, warning: string): void {
	const fragment = createFragment((el) => {
		el.createDiv({ text: `Exported ${basename(output)}` });
		const actions = el.createDiv();
		actions.createEl('a', { text: 'Open', href: '#' }).addEventListener('click', () => void shell.openPath(output));
		actions.appendText(' · ');
		actions.createEl('a', { text: 'Show in folder', href: '#' }).addEventListener('click', () => shell.showItemInFolder(output));
		if (warning) el.createDiv({ text: warning });
	});
	new Notice(fragment, warning ? 0 : 10000);
}
