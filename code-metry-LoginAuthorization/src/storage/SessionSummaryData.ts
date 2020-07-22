import { SessionSummary } from "../lib/models/models";
import { getCodeMetryDir, isWindows } from "../lib/Loggers";
import { getFileDataAsJson } from "../Util";
import fs = require("fs");

export function getSessionSummaryFile() {
    let file = getCodeMetryDir();
    if (isWindows()) {
        file += "\\sessionSummary.json";
    } else {
        file += "/sessionSummary.json";
    }
    return file;
}

export function getSessionSummaryData(): SessionSummary {
    let sessionSummaryData = getSessionSummaryFileAsJson();
    // make sure it's a valid structure
    if (!sessionSummaryData) {
        // set the defaults
        sessionSummaryData = new SessionSummary();
    }
    // fill in missing attributes
    sessionSummaryData = coalesceMissingAttributes(sessionSummaryData);
    return sessionSummaryData;
}

function coalesceMissingAttributes(data:any): SessionSummary {
    // ensure all attributes are defined
    const template: SessionSummary = new SessionSummary();
    Object.keys(template).forEach((key) => {
        if (!data[key]) {
            data[key] = 0;
        }
    });
    return data;
}

export function saveSessionSummaryToDisk(sessionSummaryData: any) {
    const file = getSessionSummaryFile();
    // JSON.stringify(data, replacer, number of spaces)
    const content = JSON.stringify(sessionSummaryData, null, 4);
    fs.writeFileSync(file, content);
}

export function getSessionSummaryFileAsJson(): SessionSummary {
    const file = getSessionSummaryFile();
    let sessionSummary = getFileDataAsJson(file);
    if (!sessionSummary) {
        sessionSummary = new SessionSummary();
        saveSessionSummaryToDisk(sessionSummary);
    }
    return sessionSummary;
}