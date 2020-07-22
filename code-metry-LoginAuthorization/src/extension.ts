// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { KpmManager } from "./lib/managers/KpmManager";
import { createCommands } from "./lib/command-helper";
import { handleSave, createGitToken } from './lib/Loggers';

const kpmController: KpmManager = KpmManager.getInstance();

export function activate(context: vscode.ExtensionContext) {

  vscode.window.showInformationMessage('Hello World from code-metry!');
  context.subscriptions.push(createCommands(kpmController));
  vscode.workspace.onDidSaveTextDocument(handleSave);
  createGitToken();
};

export function deactivate() { }