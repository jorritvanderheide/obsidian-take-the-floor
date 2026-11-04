// A talk: its slides with what you say over each, and how to move through them.

export interface Slide {
	/** The slide as HTML, as `pandoc/slides.lua` in the core made it. */
	html: string;
	/** What you say over it, as Markdown. Empty for a slide without notes. */
	notes: string;
}

/**
 * The slides pandoc made, paired with the notes `slidesOf` kept apart: one set
 * of notes for each slide, and none for the reference list, which pandoc adds at
 * the end. Null when the two don't agree on how many slides there are, because
 * then a note would show over the wrong slide.
 */
export function withNotes(slides: { html: string; closing: boolean }[], notes: string[]): Slide[] | null {
	const written = slides.filter((slide) => !slide.closing);
	if (written.length !== notes.length) return null;
	let next = 0;
	return slides.map(({ html, closing }) => ({ html, notes: closing ? '' : (notes[next++] ?? '') }));
}

/** The slide `step` away from `index`, staying on the first and the last: a clicker pressed once too often does nothing. */
export function moved(index: number, step: number, count: number): number {
	return Math.max(0, Math.min(count - 1, index + step));
}

/** How much a slide of `slide` pixels has to scale to fill `room` without leaving it, and where it starts so it stays centred. */
export function fit(room: { width: number; height: number }, slide: { width: number; height: number }): { scale: number; left: number; top: number } {
	const scale = Math.min(room.width / slide.width, room.height / slide.height);
	return { scale, left: (room.width - slide.width * scale) / 2, top: (room.height - slide.height * scale) / 2 };
}

/**
 * Whether a note looks like slides, for showing it a Present button: it has a
 * rule, as Obsidian reads it. `***` counts too, which `slidesOf` leaves on its
 * slide, so this only decides what to offer. Present works on any note.
 */
export function looksLikeSlides(sections: { type: string }[] | undefined): boolean {
	return sections?.some((section) => section.type === 'thematicBreak') ?? false;
}
