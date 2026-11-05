import { describe, expect, it } from 'vitest';
import { otherOutputs, placeAbove, placing, screenToUse, windowTitled, type NiriOutput, type NiriWindow } from '../src/core/screens';

const window = (id: number, title: string, focused = false): NiriWindow => ({ id, title, workspace_id: id * 10, is_focused: focused });

describe('placing', () => {
	it('asks niri when it is running', () => {
		expect(placing({ niriSocket: '/run/niri.sock', platform: 'linux', waylandDisplay: 'wayland-1' })).toBe('niri');
	});

	it('leaves it to you on any other Wayland desktop, where a window cannot move itself', () => {
		expect(placing({ platform: 'linux', waylandDisplay: 'wayland-0' })).toBe('by hand');
	});

	it.each(['darwin', 'win32'])('lets the window move itself on %s', (platform) => {
		expect(placing({ platform })).toBe('electron');
	});

	it('lets the window move itself on X11', () => {
		expect(placing({ platform: 'linux' })).toBe('electron');
	});
});

describe('windowTitled', () => {
	it('finds the window', () => {
		expect(windowTitled([window(1, 'Slideshow'), window(2, 'Note')], 'Note')?.id).toBe(2);
	});

	it('takes the focused one when two share a title, as a note open in two windows does', () => {
		expect(windowTitled([window(1, 'Note'), window(2, 'Note', true)], 'Note')?.id).toBe(2);
	});

	it('says so when there is none', () => {
		expect(windowTitled([window(1, 'Note')], 'Slideshow')).toBeNull();
	});
});

describe('otherOutputs', () => {
	const output = (name: string, model: string): NiriOutput => ({ name, make: 'LG', model });
	const outputs = { 'eDP-1': output('eDP-1', 'Laptop'), 'HDMI-1': output('HDMI-1', 'Room') };
	const workspaces = [
		{ id: 10, idx: 1, output: 'eDP-1' },
		{ id: 20, idx: 1, output: 'HDMI-1' },
	];

	it('leaves out the screen Obsidian is on', () => {
		expect(otherOutputs(outputs, workspaces, window(1, 'Note'))).toEqual([{ id: 'HDMI-1', label: 'LG Room (HDMI-1)' }]);
	});

	it('goes the other way at a desk, where Obsidian is on the monitor', () => {
		expect(otherOutputs(outputs, workspaces, window(2, 'Note')).map((screen) => screen.id)).toEqual(['eDP-1']);
	});

	it('has nothing else on one screen', () => {
		expect(otherOutputs({ 'eDP-1': output('eDP-1', 'Laptop') }, workspaces, window(1, 'Note'))).toEqual([]);
	});

	it('offers every screen when it cannot tell where Obsidian is', () => {
		expect(otherOutputs(outputs, workspaces, null)).toHaveLength(2);
	});
});

describe('placeAbove', () => {
	const workspaces = [
		{ id: 10, idx: 1, output: 'eDP-1' },
		{ id: 20, idx: 2, output: 'eDP-1' },
	];

	it('is the place above yours', () => {
		expect(placeAbove(workspaces, window(2, 'Note'))).toBe(1);
	});

	it('has nowhere to go from the top one', () => {
		expect(placeAbove(workspaces, window(1, 'Note'))).toBeNull();
	});

	it('leaves it when it cannot tell where you are', () => {
		expect(placeAbove(workspaces, null)).toBeNull();
	});
});

describe('screenToUse', () => {
	const screen = (id: string) => ({ id, label: id });

	it('is none on one screen, which leaves the slideshow in a window', () => {
		expect(screenToUse([])).toBeNull();
	});

	it('is the other screen when there is one', () => {
		expect(screenToUse([screen('a')])).toEqual(screen('a'));
	});

	it('asks when there are more', () => {
		expect(screenToUse([screen('a'), screen('b')])).toBe('ask');
	});
});
