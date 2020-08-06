// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { KpmManager } from "./lib/managers/KpmManager";
import { createCommands } from "./lib/command-helper";
import { createGitToken } from "./lib/Loggers";
import { Socket } from "./WebSockets/socket";
import { CircularBuffer } from "./lib/Circular_Buffer/circularbuffer";
import { resolve } from "path";
import { rejects } from "assert";

const kpmController: KpmManager = KpmManager.getInstance();
export let socket = Socket.getInstance();
export let circularBuffer = CircularBuffer.getInstance();

export function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage("Hello World from code-metry!");
  context.subscriptions.push(createCommands(kpmController));
  // vscode.workspace.onDidSaveTextDocument(handleSave);
  createGitToken();
}

export async function deactivate() {
  return new Promise(async (resolve) => {
    (await socket).sendData(circularBuffer);
    (await socket).ws.close();
    (await socket).cancelKeepAlive();
    resolve(true);
  });
}
