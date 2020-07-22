import { getFileDataAsJson } from "../Util";
import { CacheManager } from "../cache/CacheManager";
import { getCodeMetryDir, isWindows } from "../lib/Loggers";

const cacheMgr: CacheManager = CacheManager.getInstance();

export function getFileChangeSummaryFile() {
    let file = getCodeMetryDir();
    if (isWindows()) {
        file += "\\fileChangeSummary.json";
    } else {
        file += "/fileChangeSummary.json";
    }
    return file;
}

export function getFileChangeSummaryAsJson(): any {
    let fileChangeInfoMap = cacheMgr.get("fileChangeSummary");
    if (!fileChangeInfoMap) {
        const file = getFileChangeSummaryFile();
        fileChangeInfoMap = getFileDataAsJson(file);
        if (!fileChangeInfoMap) {
            fileChangeInfoMap = {};
        } else {
            cacheMgr.set("fileChangeSummary", fileChangeInfoMap);
        }
    }
    return fileChangeInfoMap;
}
