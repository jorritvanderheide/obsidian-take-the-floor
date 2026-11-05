// Which screen the slideshow goes to, and how it gets there. Everything that
// asks a compositor or Electron is in commands/placement.ts.

/** A screen to show the slides on, as you'd recognise it. */
export interface Screen {
	/** What the compositor or Electron knows it by. */
	id: string;
	label: string;
}

export interface NiriWindow {
	id: number;
	title: string | null;
	workspace_id: number | null;
	is_focused: boolean;
}

export interface NiriWorkspace {
	id: number;
	/** Its place on its screen, from 1. */
	idx: number;
	output: string | null;
}

export interface NiriOutput {
	name: string;
	make: string;
	model: string;
}

/** How a window gets to another screen here. */
export type Placing = 'niri' | 'electron' | 'by hand';

/**
 * How to place a window. Niri says where windows go, and its socket says it's
 * running. A native Wayland app can't place itself, so on any other Wayland
 * desktop you drag it. Everywhere else the window can move itself.
 */
export function placing(env: { niriSocket?: string; platform: string; waylandDisplay?: string }): Placing {
	if (env.niriSocket) return 'niri';
	if (env.platform === 'linux' && env.waylandDisplay) return 'by hand';
	return 'electron';
}

/** The window with this title, the focused one if two share it. */
export function windowTitled(windows: NiriWindow[], title: string): NiriWindow | null {
	const named = windows.filter((window) => window.title === title);
	return named.find((window) => window.is_focused) ?? named[0] ?? null;
}

/** Every screen but the one `home` is on, or all of them when that's not known. */
export function otherOutputs(outputs: Record<string, NiriOutput>, workspaces: NiriWorkspace[], home: NiriWindow | null): Screen[] {
	const here = workspaces.find((workspace) => workspace.id === home?.workspace_id)?.output ?? null;
	return Object.entries(outputs)
		.filter(([name]) => name !== here)
		.map(([name, output]) => ({ id: name, label: `${output.make} ${output.model} (${name})` }));
}

/**
 * Where the slideshow goes when its screen does: the place of the workspace above
 * `home`, one step away. Niri would leave it below all the others. Null when `home`
 * is the top one, or isn't known, which leaves it where niri put it.
 */
export function placeAbove(workspaces: NiriWorkspace[], home: NiriWindow | null): number | null {
	const here = workspaces.find((workspace) => workspace.id === home?.workspace_id);
	return here && here.idx > 1 ? here.idx - 1 : null;
}

/** The screen to use without asking, null for none at all, or `ask` when there's a choice to make. */
export function screenToUse(others: Screen[]): Screen | null | 'ask' {
	if (others.length > 1) return 'ask';
	return others[0] ?? null;
}
