// The two sides of a talk: the slides for the room, the notes for you.
import { Component, ItemView, MarkdownRenderer, setIcon, type WorkspaceLeaf } from 'obsidian';
import type { Presentation } from '../commands/presentation';
import { clock, tooLongMessage, type Slide } from '../core/talk';
import { createStage, fitStage, showOnStage, slidesTooLong } from './stage';

export const SLIDESHOW_VIEW = 'take-the-floor-slideshow';
export const NOTES_VIEW = 'take-the-floor-notes';

/** The talk in progress, or null when there is none: a window Obsidian restored from a talk that's over. */
type Current = () => Presentation | null;

export class SlideshowView extends ItemView {
	private room: HTMLElement | null = null;
	private stage: HTMLElement | null = null;
	/** The slides last measured for fit: they change while the screen is blank. */
	private measured: Slide[] | null = null;
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
		this.stage = createStage(this.room);
		const show = () => this.show(talk);
		this.stop = talk.listen(show);
		show();
		this.onResize();
		await this.measure(talk);
	}

	/** Here, in the window that shows them, so with its fonts and sizes. */
	private async measure(talk: Presentation): Promise<void> {
		if (!this.room || this.measured === talk.slides) return;
		const slides = talk.slides;
		this.measured = slides;
		const numbers = await slidesTooLong(this.room, slides);
		if (talk.slides === slides) talk.tooLong(numbers);
	}

	private show(talk: Presentation): void {
		const slide = talk.slides[talk.index];
		if (!this.room || !this.stage || !slide) return;
		this.room.toggleClass('take-the-floor-blank', talk.blank);
		showOnStage(this.stage, talk.blank ? null : slide.html);
		void this.measure(talk);
	}

	onResize(): void {
		if (this.room && this.stage) fitStage(this.stage, this.room);
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
	private timer: HTMLElement | null = null;
	private message: HTMLElement | null = null;
	private warning: HTMLElement | null = null;
	private now: { frame: HTMLElement; stage: HTMLElement; caption: HTMLElement } | null = null;
	private next: { frame: HTMLElement; stage: HTMLElement; caption: HTMLElement } | null = null;
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
		this.timer = bar.createDiv({ cls: 'take-the-floor-notes-timer' });
		const button = (label: string, icon: string, run: () => void) => {
			const el = bar.createEl('button', { attr: { 'aria-label': label } });
			setIcon(el, icon);
			this.registerDomEvent(el, 'click', run);
		};
		button('Previous slide', 'arrow-left', () => talk.move(-1));
		button('Next slide', 'arrow-right', () => talk.move(1));
		button('Hide or show the slides', 'eye-off', () => talk.toggleBlank());
		button('End presentation', 'square', () => talk.end());
		this.message = this.contentEl.createDiv({ cls: 'take-the-floor-notes-message' });
		this.warning = this.contentEl.createDiv({ cls: 'take-the-floor-notes-message' });

		const frames = this.contentEl.createDiv({ cls: 'take-the-floor-notes-frames' });
		const frame = (caption: string) => {
			const box = frames.createDiv({ cls: 'take-the-floor-notes-slide' });
			const label = box.createDiv({ cls: 'take-the-floor-notes-caption', text: caption });
			const el = box.createDiv({ cls: 'take-the-floor-frame' });
			return { frame: el, stage: createStage(el), caption: label };
		};
		this.now = frame('On the screen');
		this.next = frame('Next');

		this.body = this.contentEl.createDiv({ cls: 'take-the-floor-notes-body markdown-rendered' });
		// A link in your notes opens the note, such as a paper during the questions.
		this.registerDomEvent(this.body, 'click', (event) => {
			const link = event.target instanceof Element ? event.target.closest('a.internal-link') : null;
			const target = link?.getAttribute('data-href');
			if (!target) return;
			event.preventDefault();
			void this.app.workspace.openLinkText(target, talk.source, 'tab');
		});

		const tick = () => this.timer?.setText(clock(Date.now() - talk.startedAt));
		tick();
		this.registerInterval(window.setInterval(tick, 1000));
		const show = () => void this.show(talk);
		this.stop = talk.listen(show);
		this.onResize();
		await this.show(talk);
	}

	private async show(talk: Presentation): Promise<void> {
		const slide = talk.slides[talk.index];
		if (!this.heading || !this.body || !this.now || !this.next || !slide) return;
		this.heading.setText(`Slide ${talk.index + 1} of ${talk.slides.length}`);
		this.message?.setText(talk.message);
		this.message?.toggle(talk.message !== '');
		const warning = tooLongMessage(talk.tooLongSlides);
		this.warning?.setText(warning);
		this.warning?.toggle(warning !== '');

		const following = talk.slides[talk.index + 1];
		// Still here while the room sees nothing, to watch your changes on.
		showOnStage(this.now.stage, slide.html);
		this.now.caption.setText(talk.blank ? 'Hidden, so you can edit it. Press Esc to show it.' : 'On the screen');
		showOnStage(this.next.stage, following?.html ?? null);
		this.next.frame.toggleClass('take-the-floor-frame-end', following === undefined);
		this.next.caption.setText(following === undefined ? 'That was the last slide' : 'Next');

		this.body.empty();
		if (this.rendered) this.removeChild(this.rendered);
		this.rendered = this.addChild(new Component());
		if (slide.notes === '') {
			this.body.createEl('p', { cls: 'take-the-floor-no-notes', text: 'No notes for this slide.' });
			return;
		}
		await MarkdownRenderer.render(this.app, slide.notes, this.body, talk.source, this.rendered);
	}

	onResize(): void {
		for (const each of [this.now, this.next]) {
			if (each) fitStage(each.stage, each.frame);
		}
	}

	async onClose(): Promise<void> {
		this.stop?.();
		this.current()?.end();
		await Promise.resolve();
	}
}
