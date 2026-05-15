import { homedir } from 'node:os';
import { basename, dirname, extname, sep } from 'node:path';
import * as vscode from 'vscode';

/** @param {string} path */
const tildify = (path) => {
	const homeDir = homedir();

	if (path === homeDir) {
		return '~';
	}

	if (path.startsWith(homeDir + sep)) {
		return `~${path.slice(homeDir.length)}`;
	}

	return path;
};

const getRecentWorkspaces = async () => {
	/** @type {{ workspaces: ({ workspace: { configPath: import('vscode').Uri } } | {})[] }} */
	const recentlyOpened = await vscode.commands.executeCommand('_workbench.getRecentlyOpened');

	const workspaces = recentlyOpened.workspaces
		.filter((maybeRecentWorkspace) => 'workspace' in maybeRecentWorkspace)
		.map((recentWorkspace) => recentWorkspace.workspace.configPath)
		.map((uri) => /** @satisfies {import('vscode').QuickPickItem & { description: string, uri: import('vscode').Uri }} */ ({
			label: basename(uri.path, extname(uri.path)),
			description: tildify(dirname(uri.path)),
			buttons: [ {
				iconPath: new vscode.ThemeIcon('remove-close'),
				tooltip: 'Remove from recent workspaces'
			} ],
			uri
		}));

	const configuration = vscode.workspace.getConfiguration('koffeine');
	const workspaceGroups = /** @type {{ [ key: string ]: string[] }} */ (configuration.get('workspaceGroups'));
	const defaultWorkspaceGroupLabel = /** @type {string} */ (configuration.get('defaultWorkspaceGroupLabel'));
	const allPrefixes = Object.values(workspaceGroups).flat();

	return [
		...Object
			.entries(workspaceGroups)
			.flatMap(([ label, prefixes ]) => [
				{ label, kind: vscode.QuickPickItemKind.Separator },
				...workspaces
					.filter((workspace) => prefixes.some((prefix) => workspace.description.startsWith(prefix)))
					.toSorted((a, b) => a.label.localeCompare(b.label))
			]),
		{ label: defaultWorkspaceGroupLabel, kind: vscode.QuickPickItemKind.Separator },
		...workspaces
			.filter((workspace) => allPrefixes.every((prefix) => !workspace.description.startsWith(prefix)))
			.toSorted((a, b) => a.label.localeCompare(b.label))
	];
};

export const openRecentWorkspace = async () => {
	/** @type {import('vscode').QuickPick<Awaited<ReturnType<typeof getRecentWorkspaces>>[0]>} */
	const quickPick = vscode.window.createQuickPick();

	quickPick.busy = true;
	quickPick.placeholder = 'Open recent workspace...';

	quickPick.onDidTriggerItemButton(async (event) => {
		quickPick.busy = true;

		const item = event.item;

		if ('uri' in item) {
			await vscode.commands.executeCommand('vscode.removeFromRecentlyOpened', item.uri);

			quickPick.items = await getRecentWorkspaces();
		}

		quickPick.busy = false;
	});

	quickPick.onDidAccept(async () => {
		quickPick.hide();

		const item = quickPick.selectedItems[0];

		if ('uri' in item) {
			await vscode.commands.executeCommand('vscode.openFolder', item.uri);
		}
	});

	quickPick.onDidHide(() => quickPick.dispose());

	quickPick.show();

	quickPick.items = await getRecentWorkspaces();
	quickPick.busy = false;
};
