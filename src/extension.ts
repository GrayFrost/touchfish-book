// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { QidianTreeDataProvider } from './providers/QidianTreeDataProvider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "touchfish-book" is now active!');

	// 创建起点三江 TreeDataProvider
	const qidianTreeDataProvider = new QidianTreeDataProvider();

	// 注册起点 TreeView
	const qidianTreeView = vscode.window.createTreeView('qidian', {
		treeDataProvider: qidianTreeDataProvider,
		showCollapseAll: true
	});

	context.subscriptions.push(qidianTreeView);

	// 注册刷新命令
	const refreshCommand = vscode.commands.registerCommand('touchfish-book.refreshQidian', () => {
		qidianTreeDataProvider.refresh();
	});

	context.subscriptions.push(refreshCommand);

	// 注册打开小说命令
	const openNovelCommand = vscode.commands.registerCommand('touchfish-book.openNovel', (url: string, title: string) => {
		if (url) {
			vscode.env.openExternal(vscode.Uri.parse(url));
		} else {
			vscode.window.showInformationMessage(`小说：${title}`);
		}
	});

	context.subscriptions.push(openNovelCommand);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('touchfish-book.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from touchfish-book!');
	});

	context.subscriptions.push(disposable);

	// 打开看书标签命令
	const openBookCommand = vscode.commands.registerCommand('touchfish-book.zzh', () => {
		vscode.commands.executeCommand('workbench.view.extension.touchfish-book');
	});

	context.subscriptions.push(openBookCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
