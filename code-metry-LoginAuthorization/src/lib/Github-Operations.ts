import * as vscode from 'vscode';
import * as fs from 'fs';
import { exec } from "child_process";
import { isWindows, getToken } from './Loggers';
const fetch = require('node-fetch');

export function getProjectDir(fileName : any = null) {

    let workspaceFolders = getWorkspaceFolders();

    if (!workspaceFolders || workspaceFolders.length === 0) {
        return null;
    }

	if (workspaceFolders && workspaceFolders.length > 0) {

        if (!fileName) {
            return workspaceFolders[0].uri.fsPath;
        }

        for (let i = 0; i < workspaceFolders.length; i++) {
            const dir = workspaceFolders[i].uri.fsPath;
            if (fileName.includes(dir)) {
                return dir;
            }
        }
    }
    return null;
}

export function getWorkspaceFolders(): vscode.WorkspaceFolder[] {

    let folders = [];
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        for (let i = 0; i < vscode.workspace.workspaceFolders.length; i++) {
            let workspaceFolder = vscode.workspace.workspaceFolders[i];
            let folderUri = workspaceFolder.uri;
            if (folderUri && folderUri.fsPath) {
                folders.push(workspaceFolder);
            }
        }
    }
    return folders;
}

export function isGitProject(projectDir: string) : boolean {
    exec('git status', {cwd: projectDir}, (error: any, stdout: any, stderr: any) => {
        if (stderr) {
            return false;
        }
    });
    return true;
}

export async function performGitOps(file : string, options : any) {
    const projectDir = getProjectDir();
    if (!projectDir) {
        console.log('Project DIR');
        return;
    }
    if (!isGitProject(projectDir)) {
        return;
    }
    exec('git add ' + file, options, (error: any) => {
        if (!error) {
            let date = new Date(Date.now()).toString().slice(4, 11);
            let time = new Date(Date.now()).toString().slice(15, 24);
            const timestamp = date + time;
            exec(`git commit -m "${timestamp}"`, options, (error: any) => {
                if (!error) {
                    exec('git config --get remote.origin.url', options, (error: any, stdout: any) => {
                        if (!error) {
                            exec('git push -u ' + stdout, options, (error: any) => {
                                if (error) {
                                    console.log(error);
                                }
                            });
                        }
                        if (error) {
                            console.log(error);
                        }
                    });
                }
            });
        }
    });
}

export async function createPullRequest() {

    let workingDir = getProjectDir();
    if (workingDir !== null) {
        if (workingDir !== null) {
            exec('git config --get remote.origin.url', {cwd: workingDir}, (error: any, stdout: any) => {

                if (!error) {

                    let ownerAndRepoInfo = "" + stdout.toString().replace("https://github.com/", "").replace(".git", "");

                    if (workingDir !== null) {

                        exec('git rev-parse --abbrev-ref HEAD', {cwd: workingDir}, async (error: any, stdout: any) => {

                            if (!error) {
                                let githubData = JSON.parse(fs.readFileSync(getToken(), {encoding:'utf8', flag:'r'}));

                                if (githubData.token.trim().length === 0) {
                                    return;
                                }

                                let branch = stdout;

                                const headers = {
                                    // "Authorization" : "Token 75fcf7dbe7b14812110c68c0f17b39907a9347e6"
                                    "Authorization" : `Token ${githubData.token}`
                                };

                                ownerAndRepoInfo = ownerAndRepoInfo.replace(/(\r\n|\n|\r)/gm, "");

                                let url = "https://api.github.com/repos/" + ownerAndRepoInfo + "/pulls";

                                let head = ownerAndRepoInfo.split("/")[0] + ":" + branch.replace(/(\r\n|\n|\r)/gm, "");

                                let title : any;

                                if (isWindows()) {
                                    title = workingDir?.slice(workingDir.lastIndexOf("\\") + 1, );
                                } else {
                                    title = workingDir?.slice(workingDir.lastIndexOf("/") + 1, );
                                }

                                fetch(url, {

                                    "method": "post",
                                    "headers": headers,

                                    "body": JSON.stringify({

                                        "title": title,
                                        "body": "Please pull these awesome changes in!",
                                        "head": head,
                                        "base": "master",

                                    })
                                })

                                .then((res: { json: () => any; }) => res.json())
                                .then(async (json: any) => {
                                    if ("errors" in json) {
                                        vscode.window.showInformationMessage("You Have Already Submitted");

                                    } else {
                                        fetch(json.url + "/requested_reviewers", {

                                            "method": "post",
                                            "headers": headers,
                                            "body": JSON.stringify({
                                                "reviewers": JSON.parse(githubData.reviewers)
                                                })
                                        })
                                        .then((res: { json: () => any; }) => res.json())
                                        .then(async (json: any) => {

                                            if ("url" in json) {
                                                vscode.window.showInformationMessage(`Intimated to your reviewers ${githubData.reviewers}`);
                                                vscode.window.showInformationMessage('Submitted Successfully');
                                            } else {
                                                vscode.window.showInformationMessage("Not a Collabarator");
                                            }
                                        })
                                        .catch((error: any) => {
                                            console.log("Reviewers Error", error);
                                            ;
                                        });
                                    }
                                })
                                .catch((error: any) => {
                                    console.log("Pull request Error", error);

                                });
                            }
                        });
                    }
                }
            });
        }
    }
}