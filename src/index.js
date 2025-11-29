import * as vscode from 'vscode';
import { replaceInFolder } from './replace-in-folder.js';

/** @param {import('vscode').ExtensionContext} context */
export const activate = (context) => {
	context.subscriptions.push(
		vscode.commands.registerCommand('koffeine.replaceInFolder', replaceInFolder)
	);
};

export const deactivate = () => { /* empty */ };
