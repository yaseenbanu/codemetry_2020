import { workspace, TextDocument } from "vscode";
import moment = require("moment-timezone");
import fs = require("fs");
import os = require("os");

const dayFormat = "YYYY-MM-DD";
const dayTimeFormat = "LLLL";

export function getProjectFolder(fileName: string | string[]) {
    let liveshareFolder = null;
    if (workspace.workspaceFolders && workspace.workspaceFolders.length > 0) {
        for (let i = 0; i < workspace.workspaceFolders.length; i++) {
            let workspaceFolder = workspace.workspaceFolders[i];
            if (workspaceFolder.uri) {
                let isVslsScheme =
                    workspaceFolder.uri.scheme === "vsls" ? true : false;
                if (isVslsScheme) {
                    liveshareFolder = workspaceFolder;
                }
                let folderUri = workspaceFolder.uri;
                if (
                    folderUri &&
                    folderUri.fsPath &&
                    !isVslsScheme &&
                    fileName.includes(folderUri.fsPath)
                ) {
                    return workspaceFolder;
                }
            }
        }
    }
    // wasn't found but if liveshareFolder was found, return that
    if (liveshareFolder) {
        return liveshareFolder;
    }
    return null;
}

export function getRootPathForFile(fileName: string | string[]) {
    let folder = getProjectFolder(fileName);
    if (folder) {
        return folder.uri.fsPath;
    }
    return null;
}

export function isFileActive(file: string): boolean {
    if (workspace.textDocuments) {
        for (let i = 0; i < workspace.textDocuments.length; i++) {
            const doc: TextDocument = workspace.textDocuments[i];
            if (doc && doc.fileName === file) {
                return true;
            }
        }
    }
    return false;
}

export function getFileAgeInDays(file: any) {
    if (!fs.existsSync(file)) {
        return 0;
    }
    const stat = fs.statSync(file);
    let creationTimeSec = stat.birthtimeMs || stat.ctimeMs;
    // convert to seconds
    creationTimeSec /= 1000;

    const daysDiff : number = moment
        .duration(moment().diff(moment.unix(creationTimeSec)))
        .asDays();

    // if days diff is 0 then use 200, otherwise 100 per day, which is equal to a 9000 limit for 90 days
    return daysDiff > 1 ? parseInt(daysDiff.toString(), 10) : 1;
}

export function getFileType(fileName: string) {
    let fileType = "";
    const lastDotIdx = fileName.lastIndexOf(".");
    const len = fileName.length;
    if (lastDotIdx !== -1 && lastDotIdx < len - 1) {
        fileType = fileName.substring(lastDotIdx + 1);
    }
    return fileType;
}

export function getNowTimes() {
    const now = moment.utc();
    const now_in_sec = now.unix();
    const offset_in_sec = moment().utcOffset() * 60;
    const local_now_in_sec = now_in_sec + offset_in_sec;
    const utcDay = now.format(dayFormat);
    const day = moment().format(dayFormat);
    const localDayTime = moment().format(dayTimeFormat);

    return {
        now,
        now_in_sec,
        offset_in_sec,
        local_now_in_sec,
        utcDay,
        day,
        localDayTime,
    };
}

export function getOs() {
    let parts = [];
    let osType = os.type();
    if (osType) {
        parts.push(osType);
    }
    let osRelease = os.release();
    if (osRelease) {
        parts.push(osRelease);
    }
    let platform = os.platform();
    if (platform) {
        parts.push(platform);
    }
    if (parts.length > 0) {
        return parts.join("_");
    }
    return "";
}

export function isEmptyObj(obj: { constructor?: any; }) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

function roundUp(num: number, precision: number) {
    precision = Math.pow(10, precision);
    return Math.ceil(num * precision) / precision;
}

export function humanizeMinutes(min: string | number) {

    let str = "";

    if (typeof min === 'string') {

       const minValue = parseInt(min, 0) || 0;

        if (minValue === 60) {
            str = "1 hr";
        } else if (minValue > 60) {
            let hrs = parseFloat(min) / 60;
            const roundedTime = roundUp(hrs, 1);
            str = roundedTime.toFixed(1) + " hrs";
        } else if (minValue === 1) {
            str = "1 min";
        } else {
            // less than 60 seconds
            str = minValue.toFixed(0) + " min";
        }
    }
    return str;
}

export function cleanJsonString(content: string) {
    content = content.replace(/\r\n/g, "").replace(/\n/g, "").trim();
    return content;
}

export function deleteFile(file: fs.PathLike) {
    // if the file exists, get it
    if (fs.existsSync(file)) {
        fs.unlinkSync(file);
    }
}

export function getFileDataAsJson(file: string) {
    let data = null;
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, { encoding: "utf8" }).toString();
        if (content) {
            try {
                data = JSON.parse(cleanJsonString(content));
            } catch (e) {
                // error trying to read the session file, delete it
                deleteFile(file);
            }
        }
    }
    return data;
}

export function getFileDataArray(file: string) {
    let payloads: any[] = [];
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, { encoding: "utf8" }).toString();
        try {
            let jsonData = JSON.parse(cleanJsonString(content));
            if (!Array.isArray(jsonData)) {
                payloads.push(jsonData);
            } else {
                payloads = jsonData;
            }
        } catch (e) {
            console.log(`Error reading file array data: ${e.message}`);
        }
    }
    return payloads;
}
