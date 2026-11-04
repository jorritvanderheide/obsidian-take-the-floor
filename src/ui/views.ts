// The two sides of a talk: the slides for the room, the notes for you.
import { Component, ItemView, MarkdownRenderer, sanitizeHTMLToDom, setIcon, type WorkspaceLeaf } from 'obsidian';
import type { Presentation } from '../commands/presentation';
import { fit } from '../core/talk';

export const SLIDESHOW_VIEW = 'take-the-floor-slideshow';
export const NOTES_VIEW = 'take-the-floor-notes';

/** The size slides are laid out at, scaled to whatever screen shows them, so a slide looks the same on every one. */
const STAGE = { width: 1920, height: 1080 };

/** The talk in progress, or null when there is none: a window Obsidian restored from a talk that's over. */
type Current = () => Presentation | null;

export class SlideshowView extends ItemView {
	private room: HTMLElement | null = null;
	private stage: HTMLElement | null = null;
	private stop: (() => void) | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly current: Current,
	) {
		super(leaf);
	}

	getViewType(): string {
		return SLIDESHOW_VIEW;
	}

	getDisplayText(): string {
		return 'Slideshow';
	}

	getIcon(): string {
		return 'presentation';
	}

	async onOpen(): Promise<void> {
		const talk = this.current();
		if (talk === null) return;
		// On the window's body and not in the view, over everything Obsidian and the
		// theme draw: a theme's frames and margins are on the containers around a view.
		this.room = this.leaf.getContainer().win.document.body.createDiv({ cls: 'take-the-floor-room' });
		this.stage = this.room.createDiv({ cls: 'take-the-floor-stage markdown-rendered' });
		this.stage.setCssProps({ '--take-the-floor-width': `${STAGE.width}px`, '--take-the-floor-height': `${STAGE.height}px` });
		const show = () => this.show(talk);
		this.stop = talk.listen(show);
		show();
		this.onResize();
		await Promise.resolve();
	}

	private show(talk: Presentation): void {
		const slide = talk.slides[talk.index];
		if (!this.stage || !slide) return;
		this.stage.empty();
		this.stage.append(sanitizeHTMLToDom(slide.html));
	}

	onResize(): void {
		if (!this.room || !this.stage) return;
		const { scale, left, top } = fit({ width: this.room.clientWidth, height: this.room.clientHeight }, STAGE);
		this.stage.setCssProps({ '--take-the-floor-scale': String(scale), '--take-the-floor-left': `${left}px`, '--take-the-floor-top': `${top}px` });
	}

	async onClose(): Promise<void> {
		this.stop?.();
		this.room?.remove();
		this.current()?.end();
		await Promise.resolve();
	}
}

export class NotesView extends ItemView {
	private heading: HTMLElement | null = null;
	private message: HTMLElement | null = null;
	private body: HTMLElement | null = null;
	private rendered: Component | null = null;
	private stop: (() => void) | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly current: Current,
	) {
		super(leaf);
	}

	getViewType(): string {
		return NOTES_VIEW;
	}

	getDisplayText(): string {
		return 'Speaker notes';
	}

	getIcon(): string {
		return 'presentation';
	}

	async onOpen(): Promise<void> {
		const talk = this.current();
		if (talk === null) return;
		this.contentEl.empty();
		this.contentEl.addClass('take-the-floor-notes');
		const bar = this.contentEl.createDiv({ cls: 'take-the-floor-notes-bar' });
		this.heading = bar.createDiv({ cls: 'take-the-floor-notes-heading' });
		const button = (label: string, icon: string, run: () => void) => {
			const el = bar.createEl('button', { attr: { 'aria-label': label } });
			setIcon(el, icon);
			this.registerDomEvent(el, 'click', run);
		};
		button('Previous slide', 'arrow-left', () => talk.move(-1));
		button('Next slide', 'arrow-right', () => talk.move(1));
		button('End presentation', 'square', () => talk.end());
		this.message = this.contentEl.createDiv({ cls: 'take-the-floor-notes-message' });
		this.body = this.contentEl.createDiv({ cls: 'take-the-floor-notes-body markdown-rendered' });
		// A link in your notes opens the note, such as a paper during the questions.
		this.registerDomEvent(this.body, 'click', (event) => {
			const link = event.target instanceof Element ? event.target.closest('a.internal-link') : null;
			const target = link?.getAttribute('data-href');
			if (!target) return;
			event.preventDefault();
			void this.app.workspace.openLinkText(target, talk.source, 'tab');
		});
		const show = () => void this.show(talk);
		this.stop = talk.listen(show);
		await this.show(talk);
	}

	private async show(talk: Presentation): Promise<void> {
		const slide = talk.slides[talk.index];
		if (!this.heading || !this.body || !slide) return;
		this.heading.setText(`Slide ${talk.index + 1} of ${talk.slides.length}`);
		this.message?.setText(talk.message);
		this.message?.toggle(talk.message !== '');
		this.body.empty();
		if (this.rendered) this.removeChild(this.rendered);
		this.rendered = this.addChild(new Component());
		if (slide.notes === '') {
			this.body.createEl('p', { cls: 'take-the-floor-no-notes', text: 'No notes for this slide.' });
			return;
		}
		await MarkdownRenderer.render(this.app, slide.notes, this.body, talk.source, this.rendered);
	}

	async onClose(): Promise<void> {
		this.stop?.();
		this.current()?.end();
		await Promise.resolve();
	}
}
