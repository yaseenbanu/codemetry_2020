import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import { execFile, exec } from 'child_process';
import { performGitOps, getProjectDir } from './Github-Operations';
import { getCurrentPayloadFile } from './managers/FileManager';
import { KpmManager } from './managers/KpmManager';
import { captureAutogradeLogs } from './type';
const fetch = require('node-fetch');
const path = require("path");

export function isWindows() {
    return process.platform.indexOf("win32") !== -1;
}

export async function getRecordSummary() {
    let file = getCodeMetryDir();
    file = path.join(file, "summary.json");

    // if (isWindows()) {
    //     file += "\\summary.json";
    // } else {
    //     file += "/summary.json";
    // }
    return file;
}

export function getCodeMetryDir(autoCreate = true) {
    const homedir = os.homedir();
    let codeMetryDir = homedir;
    // if (isWindows()) {
    //     codeMetryDir += "\\.codemetry";
    // } else {
    //     codeMetryDir += "/.codemetry";
    // }
    codeMetryDir = path.join(os.homedir(), ".codemetry");

    if (autoCreate && !fs.existsSync(codeMetryDir)) {
        fs.mkdirSync(codeMetryDir);
    }
    return codeMetryDir;
}

export function getCompilerLog() {
    let file = getCodeMetryDir();
    file = path.join(file, "compilerLog.txt");

    // if (isWindows()) {
    //     file += "\\compilerLog.txt";
    // } else {
    //     file += "/compilerLog.txt";
    // }
    return file;
}

export function createGitToken() {
    if (!fs.existsSync(getToken())) {
        let token = 'personalAccessToken';
        let reviewers = "Reviewer_1,Reviewer_2,Reviewer_3".split(",");
        fs.writeFileSync(getToken(), JSON.stringify(
            {
                token: token,
                reviewers: JSON.stringify(reviewers)
            }
        ));
    }
}


export function getJWT() {
    let file = getCodeMetryDir();
    file = path.join(file, "session.json");

    // if (isWindows()) {
    //     file += "\\session.json";
    // } else {
    //     file += "/session.json";
    // }
    return file;
}

export function getToken() {
    let file = getCodeMetryDir();
    file = path.join(file, "gitToken.json");

    // if (isWindows()) {
    //     file += "\\gitToken.json";
    // } else {
    //     file += "/gitToken.json";
    // }
    return file;
}

export function getFileExtension(event: vscode.TextDocument): string {
    return event.languageId;
}

export function getFileName(event: vscode.TextDocument): string {

    return path.basename(event.fileName);

    // console.log(" path.basename(event.fileName) ", path.basename(event.fileName));
    // if (isWindows()) {
    //     return event.fileName.substring(event.fileName.lastIndexOf('\\') + 1,);
    // } else {
    //     return event.fileName.substring(event.fileName.lastIndexOf('//') + 1);
    // }

}

export function getCWD(event: vscode.TextDocument) {

    return path.dirname(event.fileName);

    // console.log(" path.dirname(event.fileName) ", path.dirname(event.fileName));
    // if (isWindows()) {
    //     return event.fileName.substring(0, event.fileName.lastIndexOf('\\'));
    // } else {
    //     return event.fileName.substring(0, event.fileName.lastIndexOf('//'));
    // }
}

export async function runProcess(command: string, file: string,
    options: { cwd: string; timeout: number; }, message: string, key: string,
    event: vscode.TextDocument): Promise<boolean> {
    let compilerLog = getCompilerLog();
    return new Promise(function (resolve, reject) {
        execFile(command, [file], options, async (error) => {
            const timestamp = new Date(Date.now()).toString();
            // console.log("errorerrorerror  ", error);
            if (error) {
                const temp = "  ";
                fs.appendFileSync(compilerLog, '\n' + 'Time Stamp : ' + timestamp + '\n' + error);
                // console.log(" " + error);
                // console.log("PINGA");
                captureAutogradeLogs(" " + error);
                await postKeyStrokes();
                return true;
            }
            fs.appendFileSync(compilerLog, '\n' + 'Time Stamp : ' + timestamp + '\n' + message);
            resolve(false);
        });
    });
}

export async function createLog(log: any) {
    // console.log(log);
}

export async function postKeyStrokes() {
    setTimeout(() => {
        postKeyStrokes2();
    }, 3000);
}

export async function postKeyStrokes2() {
    console.log(" postKeyStrokes ");
    let jsonData = JSON.parse(fs.readFileSync(await getCurrentPayloadFile(), { encoding: 'utf8', flag: 'r' }));
    jsonData.timestamp = new Date(Date.now()).toString();
    console.log(jsonData);
    // console.log("PostKeystrokes");
    fs.appendFileSync(await getRecordSummary(), JSON.stringify(jsonData, null, 4));
    let url = 'https://99mz1d1ujl.execute-api.ap-south-1.amazonaws.com/Store_vsc_log_dev/store-vsc-logs-resource';

    // console.log('CAME');

    fetch(url, {
        method: 'post',
        body: JSON.stringify({
            jsonData: jsonData,
        })
    })
        .then((res: { json: () => any; }) => res.json())
        .then(async (json: any) => {
            console.log(json);
            KpmManager.getInstance().clear();
        });
}
export async function handleSave(event: vscode.TextDocument) {
    setTimeout(() => {
        handleSave2(event);
    }, 3000);
}

export async function handleSave2(event: vscode.TextDocument) {

    const fileExtension = getFileExtension(event);
    const file = getFileName(event);
    const workingDir = getCWD(event);
    const options = { cwd: workingDir, timeout: 10 * 1000 };

    // let log : Object = {timestamp: new Date(Date.now()).toString(), compileTimeError: "", runTimeError: "", autoGradeError: "" };
    // console.log("fileName = ", file)
    // console.log("workingDir = ", workingDir)
    switch (fileExtension) {
        case "python": {
            await runProcess('python', file, options, 'compiled sucessfully', "compileTimeErrors", event).then(async (error: boolean) => {
                // console.log(" error === ", error);
                if (!error) {
                    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders?.length > 0) {
                        let cwd = vscode.workspace.workspaceFolders[0].uri.fsPath;
                        // vscode.window.showErrorMessage(cwd);
                        exec('pytest', { cwd: cwd, timeout: 10 * 1000 }, async (error, stdout, stderr) => {
                            fs.appendFileSync(getCompilerLog(), '\n' + stdout + '\n' + error);
                            captureAutogradeLogs((stdout + error));
                            await postKeyStrokes();
                        });
                    }
                }
            });
            performGitOps(file, { cwd: workingDir });
        }
            break;

        case "java": {
            await runProcess('javac', file, options, 'compiled sucessfully', "compileTimeErrors", event).then(async (compileError: boolean) => {
                if (!compileError) {
                    await runProcess('java', file.replace('.java', ''), options, 'executed sucessfully', "runTimeErrors", event).then(async (runTimeError: boolean) => {
                        if (!runTimeError) {
                            const folders = vscode.workspace.workspaceFolders;
                            if (folders !== undefined && folders.length > 0) {
                                await runProcess('javac', 'TestRunner.java', { cwd: folders[0].uri.fsPath, timeout: 10 * 1000 },
                                    'executed all testcases', "autoGradeErrors", event).then(async (compilError: boolean) => {
                                        if (!compilError) {
                                            await runProcess('java', 'TestRunner', { cwd: folders[0].uri.fsPath, timeout: 10 * 1000 },
                                                'executed all testcases', "autoGradeErrors", event).then(async (error) => {
                                                    if (!error) {
                                                    } else {
                                                        await postKeyStrokes();
                                                    }
                                                });
                                        } else {
                                            await postKeyStrokes();
                                        }
                                    });
                            }
                        } else {
                            await postKeyStrokes();
                        }
                    });
                } else {
                    await postKeyStrokes();
                }
            });
            performGitOps(file, { cwd: workingDir }).then(() => {
            });
        }
            break;

        default: {
            vscode.window.showWarningMessage('Should be a Python or Java file');
        }
            break;
    }
}