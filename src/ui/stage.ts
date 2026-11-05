// A slide on a stage: laid out at one size and scaled to where it's shown, so it
// looks the same on the screen, in your notes and in the preview.
import { sanitizeHTMLToDom } from 'obsidian';
import { fit, isTooLong, type Slide } from '../core/talk';

const STAGE = { width: 1920, height: 1080 };

export function createStage(parent: HTMLElement): HTMLElement {
	const stage = parent.createDiv({ cls: 'take-the-floor-stage markdown-rendered' });
	stage.setCssProps({ '--take-the-floor-width': `${STAGE.width}px`, '--take-the-floor-height': `${STAGE.height}px` });
	return stage;
}

export function showOnStage(stage: HTMLElement, html: string | null): void {
	stage.empty();
	if (html !== null) stage.append(sanitizeHTMLToDom(html));
}

/** Scale a stage to fill what's around it. */
export function fitStage(stage: HTMLElement, around: HTMLElement): void {
	const { scale, left, top } = fit({ width: around.clientWidth, height: around.clientHeight }, STAGE);
	stage.setCssProps({ '--take-the-floor-scale': String(scale), '--take-the-floor-left': `${left}px`, '--take-the-floor-top': `${top}px` });
}

/** Whether what's on a stage doesn't fit, once its images have their size. */
export async function stageTooLong(stage: HTMLElement): Promise<boolean> {
	await Promise.all(Array.from(stage.querySelectorAll('img')).map((image) => image.decode().catch(() => undefined)));
	const slide = stage.querySelector('.slide');
	return slide !== null && isTooLong(slide.scrollHeight, slide.clientHeight);
}

/** The numbers, from 1, of the slides that don't fit, measured out of sight in `parent`'s window. */
export async function slidesTooLong(parent: HTMLElement, slides: Slide[]): Promise<number[]> {
	const stage = createStage(parent);
	stage.addClass('take-the-floor-measure');
	const numbers: number[] = [];
	for (const [index, slide] of slides.entries()) {
		showOnStage(stage, slide.html);
		if (await stageTooLong(stage)) numbers.push(index + 1);
	}
	stage.remove();
	return numbers;
}
