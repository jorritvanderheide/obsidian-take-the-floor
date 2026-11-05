import { describe, expect, it } from 'vitest';
import { clock, fit, isPresentation, isTooLong, moved, stepped, tooLongMessage, withNotes } from '../src/core/talk';

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

describe('isPresentation', () => {
	it('says yes to a note with the property on', () => {
		expect(isPresentation({ presentation: true, tags: ['type/record'] })).toBe(true);
	});

	it('says no to one with it off, or anything else in it', () => {
		expect(isPresentation({ presentation: false })).toBe(false);
		expect(isPresentation({ presentation: 'yes' })).toBe(false);
	});

	it('says no to one without, and while Obsidian has not read the note yet', () => {
		expect(isPresentation({ tags: [] })).toBe(false);
		expect(isPresentation(undefined)).toBe(false);
	});
});

describe('stepped', () => {
	it('moves when the screen shows a slide', () => {
		expect(stepped({ index: 1, blank: false }, 1, 3)).toEqual({ index: 2, blank: false });
	});

	it('only brings the same slide back off a blank screen, whichever way', () => {
		expect(stepped({ index: 1, blank: true }, 1, 3)).toEqual({ index: 1, blank: false });
		expect(stepped({ index: 1, blank: true }, -1, 3)).toEqual({ index: 1, blank: false });
	});
});

describe('clock', () => {
	it.each([
		[0, '0:00'],
		[999, '0:00'],
		[7000, '0:07'],
		[247000, '4:07'],
		[3723000, '1:02:03'],
		[-5000, '0:00'],
	])('shows %i ms as %s', (ms, shown) => {
		expect(clock(ms)).toBe(shown);
	});
});

describe('isTooLong', () => {
	it('leaves a pixel for rounding', () => {
		expect(isTooLong(1081, 1080)).toBe(false);
		expect(isTooLong(1082, 1080)).toBe(true);
	});
});

describe('tooLongMessage', () => {
	it('says nothing when they all fit', () => {
		expect(tooLongMessage([])).toBe('');
	});

	it('names one', () => {
		expect(tooLongMessage([3])).toBe('Slide 3 is too long, so its end is cut off.');
	});

	it('names several', () => {
		expect(tooLongMessage([3, 7])).toBe('Slides 3 and 7 are too long, so their ends are cut off.');
		expect(tooLongMessage([1, 3, 7])).toBe('Slides 1, 3 and 7 are too long, so their ends are cut off.');
	});
});
