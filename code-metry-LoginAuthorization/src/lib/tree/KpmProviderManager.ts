import {TreeItem, TreeItemCollapsibleState, Command, commands, TreeView,} from "vscode";
import KpmItem from "../models/models";
import path = require("path");
import { isLogged } from "../command-helper";

// this current path is in the out/lib. We need to find the resource files
// which are in out/resources
const resourcePath: string = path.join(
    __filename,
    "..",
    "..",
    "..",
    "..",
    "resources"
);

let counter = 0;

export class KpmProviderManager {

    private static instance: KpmProviderManager;

    constructor() {
        //
    }

    static getInstance(): KpmProviderManager {
        if (!KpmProviderManager.instance) {
            KpmProviderManager.instance = new KpmProviderManager();
        }

        return KpmProviderManager.instance;
    }

    async getOptionsTreeParents(): Promise<KpmItem[]> {

        counter++;
        const space = counter % 2 === 0 ? "" : " ";
        const treeItems: KpmItem[] = [];
        const logged : boolean = isLogged(); 
        if (!logged) {
            const signupWithGoogle = `Sign up with Google${space}`;
            const githubSignupButton: KpmItem = this.getActionButton(
                signupWithGoogle,
                "",
                "codemetry.googleLogin",
                "icons8-google.svg"
            );
            treeItems.push(githubSignupButton);
    } else {

        // const connectedToInfo = this.getAuthTypeIconAndLabel();
        const cmd = null; //"codetime.showAccountInfoMenu";
        
        const connectedToButton: KpmItem = this.getActionButton(
            'Connected With Google',
            'Google',
            "",
            'icons8-google.svg'
        );
        treeItems.push(connectedToButton);

        const dashBoard = `View Dashboard${space}`;
        const dashBoardButton: KpmItem = this.getActionButton(
            dashBoard,
            "",
            "codemetry.viewDashBoard",
            "icon-metrics.svg"
        );
        treeItems.push(dashBoardButton);

    }
    
    return treeItems;
    }

    getActionButton (label: string, tooltip: string, command: string, icon : any = null, eventDescription: string = "" ): KpmItem {
        const item: KpmItem = new KpmItem();
        item.tooltip = tooltip;
        item.label = label;
        item.id = label;
        item.command = command;
        item.icon = icon;
        item.contextValue = "action_button";
        item.eventDescription = eventDescription;
        return item;
    }

    async getDailyMetricsTreeParents(): Promise<KpmItem[]> {
        const treeItems: KpmItem[] = [];

        const kpmTreeParents: KpmItem[] = await this.getKpmTreeParents();
        treeItems.push(...kpmTreeParents);

        return treeItems;
    }

    async getKpmTreeParents(): Promise<KpmItem[]> {
       
        const treeItems: KpmItem[] = [];
       
        const submit = `Submit Assignment`;
        const submitAssignmentButton: KpmItem = this.getActionButton(
            submit,
            "",
            "Create-Pull-Request",
            ""
        );

        treeItems.push(submitAssignmentButton);

        return treeItems;
    }
}

export class KpmTreeItem extends TreeItem {
  
    constructor(
        private readonly treeItem: KpmItem,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public readonly command?: Command
    ) {
        super(treeItem.label, collapsibleState);

        const { lightPath, darkPath } = getTreeItemIcon(treeItem);

        if (treeItem.description) {
            this.description = treeItem.description;
        }

        if (lightPath && darkPath) {
            this.iconPath.light = lightPath;
            this.iconPath.dark = darkPath;
        } else {
            // no matching tag, remove the tree item icon path
            delete this.iconPath;
        }

        this.contextValue = getTreeItemContextValue(treeItem);
    }

    get tooltip(): string {
        if (!this.treeItem) {
            return "";
        }
        if (this.treeItem.tooltip) {
            return this.treeItem.tooltip;
        } else {
            return this.treeItem.label;
        }
    }

    iconPath = {
        light: "",
        dark: "",
    };

    contextValue = "treeItem";
}

function getTreeItemIcon(treeItem: KpmItem): any {
    const iconName = treeItem.icon;
    const lightPath =
        iconName && treeItem.children.length === 0
            ? path.join(resourcePath, "light", iconName)
            : null;
    const darkPath =
        iconName && treeItem.children.length === 0
            ? path.join(resourcePath, "dark", iconName)
            : null;
    return { lightPath, darkPath };
}

function getTreeItemContextValue(treeItem: KpmItem): string {
    if (treeItem.contextValue) {
        return treeItem.contextValue;
    }
    if (treeItem.children.length) {
        return "parent";
    }
    return "child";
}

export const handleKpmChangeSelection = (
    view: TreeView<KpmItem>,
    item: KpmItem
) => {
    if (item.command) {
        const args = item.commandArgs || null;
        if (args) {
            commands.executeCommand(item.command, ...args);
        } else {
            // run the command
            commands.executeCommand(item.command);
        }

    // deselect it
    try {
        // re-select the track without focus
        view.reveal(item, {
            focus: false,
            select: false,
        });
    } catch (err) {
        console.log(`Unable to deselect track: ${err.message}`);
    }
    };
};
