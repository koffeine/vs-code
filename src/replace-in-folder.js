import { statSync } from 'node:fs';
import { dirname, relative } from 'node:path';
import * as vscode from 'vscode';

/** @param {vscode.Uri[]} resources */
export const replaceInFolder = async (resources) => {
	const workbenchState = vscode.workspace.workspaceFile ? 'workspace' : 'folder';
	const uniqueFsPaths = new Set();

	/**
	 * Based on:
	 * - https://github.com/microsoft/vscode/blob/b10b0bbae0a5f699fd4d45d1a69ef5980f4540a0/src/vs/workbench/contrib/search/browser/searchActionsFind.ts#L396
	 * - https://github.com/microsoft/vscode/blob/b10b0bbae0a5f699fd4d45d1a69ef5980f4540a0/src/vs/workbench/services/search/common/queryBuilder.ts#L701
	 */
	const filesToInclude = resources
		.map((resource) =>
			statSync(resource.fsPath).isDirectory() ? resource : vscode.Uri.file(dirname(resource.fsPath)))
		.filter(({ fsPath }) =>
			!uniqueFsPaths.has(fsPath) && uniqueFsPaths.add(fsPath))
		.map((resource) => {
			if (workbenchState === 'folder') {
				return `./${relative(vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? '', resource.fsPath)}`;
			} else {
				const workspaceFolder = vscode.workspace.getWorkspaceFolder(resource);
				const isUniqueFolder = vscode.workspace.workspaceFolders?.filter((folder) => folder.name === workspaceFolder?.name).length === 1;

				if (isUniqueFolder) {
					const relativePath = relative(workspaceFolder?.uri.fsPath ?? '', resource.fsPath);

					return `./${workspaceFolder?.name}${relativePath ? `/${relativePath}` : ''}`;
				} else {
					return resource.fsPath;
				}
			}
		})
		.map((path) => path.replace(/([?*\[\]])/vg, '[$1]'))
		.join(', ');

	const searchConfiguration = vscode.workspace.getConfiguration('search');
	const mode = searchConfiguration.get('mode');

	if (mode !== 'view') {
		await searchConfiguration.update('mode', 'view', vscode.ConfigurationTarget.Global);
	}

	await vscode.commands.executeCommand(
		'workbench.action.findInFiles',
		{
			replace: '',
			showIncludesExcludes: true,
			filesToInclude
		}
	);

	if (mode !== 'view') {
		await searchConfiguration.update('mode', mode, vscode.ConfigurationTarget.Global);
	}
};
