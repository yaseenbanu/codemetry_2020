import { KpmManager } from "./managers/KpmManager";
import { TreeView, window, commands, Disposable } from "vscode";
import KpmItem from "./models/models";
import { CodeMetryMenuProvider, connectCodeMetryMenuTreeView } from "./tree/CodeMetryMenuProvider";
import { createPullRequest, getProjectDir, performGitOps } from "./Github-Operations";
import { KpmProvider, connectKpmTreeView } from "./tree/KpmProvider";
const fetch = require('node-fetch');
import open = require("open");
import { getJWT, getCompilerLog } from "./Loggers";
import fs = require('fs');
import { downloadAndUnzipVSCode } from "vscode-test";


let codemetryMenuTreeProvider: CodeMetryMenuProvider;

export function createCommands(kpmController: KpmManager): { dispose: () => void } {
    let cmds = [];

    cmds.push(kpmController);

    // Initialize Menu Tree
    codemetryMenuTreeProvider = new CodeMetryMenuProvider();
    const codemetryMenuTreeView: TreeView<KpmItem> = window.createTreeView(
        "cm-menu-tree",
        {
            treeDataProvider: codemetryMenuTreeProvider,
            showCollapseAll: false,
        }
    );
    codemetryMenuTreeProvider.bindView(codemetryMenuTreeView);

    cmds.push(connectCodeMetryMenuTreeView(codemetryMenuTreeView));

    cmds.push(
        commands.registerCommand("codemetry.displayTree", () => {
            codemetryMenuTreeProvider.revealTree();
        })
    );

    const kpmTreeProvider = new KpmProvider();
    const kpmTreeView: TreeView<KpmItem> = window.createTreeView(
        "cm-submissions-tree",
        {
            treeDataProvider: kpmTreeProvider,
            showCollapseAll: false,
        }
    );
    kpmTreeProvider.bindView(kpmTreeView);
    cmds.push(connectKpmTreeView(kpmTreeView));

    cmds.push(
        commands.registerCommand("codemetry.googleLogin", () => {
            login("Google");
        }),
        commands.registerCommand("Create-Pull-Request", async () => {

            let workingFolder = getProjectDir();

            await performGitOps('.', { cwd: workingFolder });

            setTimeout(() => {
                createPullRequest();
            }, 2000);
        }),

        commands.registerCommand("codemetry.viewDashBoard", () => {
            let googleID = JSON.parse(fs.readFileSync(getJWT(), { encoding: 'utf-8', flag: 'r' })).jwt;
            if (fs.existsSync(getCompilerLog())) {
                window.showErrorMessage("Dashboard !!");
                open(`http://yourdashboardvsc.s3-website.ap-south-1.amazonaws.com/search?q=${googleID}`);
            }
            else {
                window.showInformationMessage("No Work Done So Far!!");
            }
        }),
    );

    return Disposable.from(...cmds);
}

export function isLogged(): boolean {

    if (fs.existsSync(getJWT())) {

        let content = JSON.parse(fs.readFileSync(getJWT(), { encoding: 'utf8', flag: 'r' }));

        if (content.jwt.length !== 0) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

function login(authType: string) {

    window.showInformationMessage(authType);

    const url = `https://3o76nle2u4.execute-api.ap-south-1.amazonaws.com/vsc_dev/signin-vscresource`;

    let JWT_Token: string = "";

    fetch(url)
        .then((res: { json: () => any; }) => res.json())
        .then(async (json: any) => {

            if (json.statusCode === 200) {
                JWT_Token = json.JWT_Token;

                fetch(url, {
                    method: 'post',
                    body: JSON.stringify({
                        JWT_Token: JWT_Token
                    })
                })
                    .then((res: { json: () => any; }) => res.json())
                    .then(async (json: any) => {

                        if (json.statusCode === 200) {

                            open(`http://signinvscpage.s3-website.ap-south-1.amazonaws.com/search?JWT_Token=${JWT_Token}`);

                            let getResp =

                                setInterval(() => {

                                    fetch(`https://0u5p3aw12f.execute-api.ap-south-1.amazonaws.com/Final_vsc_JWT/final-vsc-jwt-resource`, {
                                        method: 'post',
                                        body: JSON.stringify({
                                            JWT_Token: JWT_Token
                                        })
                                    })
                                        .then((res: { json: () => any; }) => res.json())
                                        .then(async (json: any) => {

                                            if (json.google_Id.length !== 0) {

                                                if (!fs.existsSync(getJWT())) {
                                                    fs.writeFileSync(getJWT(), JSON.stringify({ jwt: json.google_Id }));
                                                    codemetryMenuTreeProvider.refresh();
                                                    clearInterval(getResp);
                                                }
                                            }
                                        });
                                }, 2000);

                            setTimeout(() => {
                                clearInterval(getResp);
                            }, 60 * 1000);
                        } else {
                            window.showWarningMessage("Not A Authenticated User");
                        }
                    });
            }
        });
}
