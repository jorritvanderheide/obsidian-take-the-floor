import { describe, expect, it } from 'vitest';
import { fit, moved, withNotes } from '../src/core/talk';

describe('withNotes', () => {
	const slide = (html: string, closing = false) => ({ html, closing });

	it('pairs each slide with its notes', () => {
		expect(withNotes([slide('a'), slide('b')], ['first', ''])).toEqual([
			{ html: 'a', notes: 'first' },
			{ html: 'b', notes: '' },
		]);
	});

	it('gives the reference list no notes', () => {
		expect(withNotes([slide('a'), slide('list', true)], ['first'])).toEqual([
			{ html: 'a', notes: 'first' },
			{ html: 'list', notes: '' },
		]);
	});

	it('refuses when they disagree, because a note would show over the wrong slide', () => {
		expect(withNotes([slide('a')], ['first', 'second'])).toBeNull();
		expect(withNotes([slide('a'), slide('b')], ['first'])).toBeNull();
	});
});

describe('moved', () => {
	it('moves by the step', () => {
		expect(moved(1, 1, 3)).toBe(2);
		expect(moved(1, -1, 3)).toBe(0);
	});

	it('stays on the first and the last', () => {
		expect(moved(2, 1, 3)).toBe(2);
		expect(moved(0, -1, 3)).toBe(0);
	});
});

describe('fit', () => {
	const slide = { width: 1920, height: 1080 };

	it('fills a screen of the same shape', () => {
		expect(fit({ width: 3840, height: 2160 }, slide)).toEqual({ scale: 2, left: 0, top: 0 });
	});

	it('leaves room at the sides of a wider screen', () => {
		expect(fit({ width: 2160, height: 1080 }, slide)).toEqual({ scale: 1, left: 120, top: 0 });
	});

	it('leaves room above and below on a taller screen', () => {
		expect(fit({ width: 1920, height: 1280 }, slide)).toEqual({ scale: 1, left: 0, top: 100 });
	});
});
