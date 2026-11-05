// A tab with every slide of a note, as you write it.
import { ItemView, TFile, type WorkspaceLeaf } from 'obsidian';
import { tooLongMessage, type Slide } from '../core/talk';
import { createStage, fitStage, showOnStage, stageTooLong } from './stage';

export const PREVIEW_VIEW = 'take-the-floor-preview';

/** Time after the note is saved, for typing that goes on. */
const SETTLE = 1000;

/** Renders a note's slides. `first` is when you just asked, and it may ask you things back; afterwards it never does. */
export type Render = (file: TFile, first: boolean) => Promise<Slide[] | null>;

export class PreviewView extends ItemView {
	private file: TFile | null = null;
	private message: HTMLElement | null = null;
	private list: HTMLElement | null = null;
	private frames: { frame: HTMLElement; stage: HTMLElement }[] = [];
	/** The newest render wins: a slower one that started earlier is dropped. */
	private latest = 0;
	private waiting = 0;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly render: Render,
	) {
		super(leaf);
	}

	getViewType(): string {
		return PREVIEW_VIEW;
	}

	getDisplayText(): string {
		return 'Slides';
	}

	getIcon(): string {
		return 'presentation';
	}

	async onOpen(): Promise<void> {
		this.contentEl.empty();
		this.contentEl.addClass('take-the-floor-preview');
		this.message = this.contentEl.createDiv({ cls: 'take-the-floor-notes-message' });
		this.message.hide();
		this.list = this.contentEl.createDiv({ cls: 'take-the-floor-preview-list' });
		this.registerEvent(
			this.app.vault.on('modify', (file) => {
				if (file !== this.file) return;
				// On the main window's timer, which a talk ending can't take away.
				window.clearTimeout(this.waiting);
				this.waiting = window.setTimeout(() => void this.refresh(false), SETTLE);
			}),
		);
		await Promise.resolve();
	}

	/** Show this note's slides. */
	async showNote(file: TFile): Promise<void> {
		this.file = file;
		await this.refresh(true);
	}

	private async refresh(first: boolean): Promise<void> {
		if (!this.file || !this.list || !this.message) return;
		const mine = ++this.latest;
		let slides: Slide[] | null;
		try {
			slides = await this.render(this.file, first);
		} catch (error) {
			if (mine !== this.latest) return;
			// What's there stays, so a mistake halfway through a line doesn't empty the tab.
			this.message.setText(error instanceof Error ? error.message : String(error));
			this.message.show();
			return;
		}
		if (mine !== this.latest || slides === null) return;
		const top = this.list.scrollTop;
		this.list.empty();
		this.frames = [];
		const numbers: number[] = [];
		for (const [index, slide] of slides.entries()) {
			const item = this.list.createDiv({ cls: 'take-the-floor-preview-slide' });
			const caption = item.createDiv({ cls: 'take-the-floor-notes-caption', text: String(index + 1) });
			const frame = item.createDiv({ cls: 'take-the-floor-frame' });
			const stage = createStage(frame);
			showOnStage(stage, slide.html);
			this.frames.push({ frame, stage });
			if (await stageTooLong(stage)) {
				numbers.push(index + 1);
				frame.addClass('take-the-floor-frame-too-long');
				caption.setText(`${index + 1}: too long, its end is cut off`);
			}
			if (mine !== this.latest) return;
		}
		this.onResize();
		this.list.scrollTop = top;
		const said = tooLongMessage(numbers);
		this.message.setText(said);
		this.message.toggle(said !== '');
	}

	onResize(): void {
		for (const { frame, stage } of this.frames) fitStage(stage, frame);
	}

	async onClose(): Promise<void> {
		window.clearTimeout(this.waiting);
		await Promise.resolve();
	}
}
