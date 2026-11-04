import { Plugin } from 'obsidian';
import { loadSettings, type Settings } from './core/settings';
import { SettingsTab } from './ui/settings-tab';

export default class TakeTheFloor extends Plugin {
	settings!: Settings;

	async onload() {
		this.settings = loadSettings(await this.loadData());
		this.addSettingTab(new SettingsTab(this.app, this));
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
