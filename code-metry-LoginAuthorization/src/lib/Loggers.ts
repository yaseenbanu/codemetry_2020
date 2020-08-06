import * as vscode from "vscode";
import * as fs from "fs";
import * as os from "os";
import { execFile, exec } from "child_process";
import { performGitOps, getProjectDir } from "./Github-Operations";
import { getCurrentPayloadFile } from "./managers/FileManager";
import { KpmManager } from "./managers/KpmManager";
import { captureAutogradeLogs } from "./type";
import path = require("path");
const fetch = require("node-fetch");

export function isWindows() {
  return process.platform.indexOf("win32") !== -1;
}

export function getCodeMetryDir(autoCreate = true) {
  const homedir = os.homedir();

  let codeMetryDir = homedir;

  codeMetryDir = path.join(os.homedir(), ".codemetry");

  if (autoCreate && !fs.existsSync(codeMetryDir)) {
    fs.mkdirSync(codeMetryDir);
  }

  return codeMetryDir;
}

export function getCompilerLog() {
  let file = getCodeMetryDir();
  file = path.join(file, "compilerLog.txt");
  return file;
}

export function getJWT() {
  let file = getCodeMetryDir();
  file = path.join(file, "session.json");
  return file;
}

export function createGitToken() {
  if (!fs.existsSync(getToken())) {
    let token = "personalAccessToken";
    let reviewers = "Reviewer_1,Reviewer_2,Reviewer_3".split(",");

    fs.writeFileSync(
      getToken(),
      JSON.stringify({
        token: token,
        reviewers: JSON.stringify(reviewers),
      })
    );
  }
}

export function getToken() {
  let file = getCodeMetryDir();
  file = path.join(file, "gitToken.json");
  return file;
}

export function getFileExtension(event: vscode.TextDocument): string {
  return event.languageId;
}

export function getFileName(event: vscode.TextDocument): string {
  return path.basename(event.fileName);
}

export function getCWD(event: vscode.TextDocument) {
  return path.dirname(event.fileName);
}

export async function createLog(log: any) {
  console.log(log);
}

export async function postKeyStrokes() {
  let jsonData = JSON.parse(
    fs.readFileSync(getCurrentPayloadFile(), { encoding: "utf8", flag: "r" })
  );
  jsonData.timestamp = new Date(Date.now()).toString();

  console.log(jsonData);

  let url =
    "https://99mz1d1ujl.execute-api.ap-south-1.amazonaws.com/Store_vsc_log_dev/store-vsc-logs-resource";

  console.log("CAME");

  fetch(url, {
    method: "post",
    body: JSON.stringify({
      jsonData: jsonData,
    }),
  })
    .then((res: { json: () => any }) => res.json())
    .then(async (json: any) => {
      console.log(json);
      KpmManager.getInstance().clear();
    });
}
