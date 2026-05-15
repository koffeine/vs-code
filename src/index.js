import * as vscode from 'vscode';
import { replaceInFolder } from './replace-in-folder.js';
import { openRecentWorkspace } from './open-recent-workspace.js';

/** @param {import('vscode').ExtensionContext} context */
export const activate = (context) => {
	context.subscriptions.push(
		vscode.commands.registerCommand('koffeine.replaceInFolder', (activatedResource, resources) => replaceInFolder(resources)),
		vscode.commands.registerCommand('koffeine.openRecentWorkspace', openRecentWorkspace)
	);
};

export const deactivate = () => { /* empty */ };
