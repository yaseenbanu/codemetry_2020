import * as vscode from 'vscode';

export default class KpmItem {
    id: string = "";
    label: string = "";
    description: string = "";
    value: string = "";
    tooltip: string = "";
    command: string = "";
    commandArgs: any[] = [];
    type: string = "";
    contextValue: string = "";
    callback: any = null;
    icon: string = "";
    children: KpmItem[] = [];
    eventDescription: string = "";
    initialCollapsibleState: vscode.TreeItemCollapsibleState =
        vscode.TreeItemCollapsibleState.Collapsed;
}

export class FileChangeInfo {
    keystrokes: number = 0;
    add: number = 0;
    paste: number = 0;
    delete: number = 0;
    lines: number = 0;
    linesAdded: number = 0;
    linesRemoved: number = 0;
    syntax: string = "";
    start: string = '';
    end: string = '';
}

export class SessionSummary {
    currentDayMinutes: number = 0;
    currentDayKeystrokes: number = 0;
    currentDayKpm: number = 0;
    currentDayLinesAdded: number = 0;
    currentDayLinesRemoved: number = 0;
    averageDailyMinutes: number = 0;
    averageDailyKeystrokes: number = 0;
    averageDailyKpm: number = 0;
    averageLinesAdded: number = 0;
    averageLinesRemoved: number = 0;
    timePercent: number = 0;
    volumePercent: number = 0;
    velocityPercent: number = 0;
    liveshareMinutes: number = 0;
    latestPayloadTimestampEndUtc: number = 0;
    latestPayloadTimestamp: number = 0;
    lastUpdatedToday: boolean = false;
    currentSessionGoalPercent: number = 0;
    inFlow: boolean = false;
    dailyMinutesGoal: number = 0;
    globalAverageSeconds: number = 0;
    globalAverageDailyMinutes: number = 0;
    globalAverageDailyKeystrokes: number = 0;
    globalAverageLinesAdded: number = 0;
    globalAverageLinesRemoved: number = 0;
}
