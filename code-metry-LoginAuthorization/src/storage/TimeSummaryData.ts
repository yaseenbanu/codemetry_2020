import CodeMetrySummary from "../lib/models/CodeMetrySummary";
import moment = require("moment-timezone");
import { getCodeMetryDir, isWindows } from "../lib/Loggers";
import { getFileDataArray } from "../Util";
import TimeData from "../lib/models/TimeData";

const dayFormat = "YYYY-MM-DD";
const dayTimeFormat = "LLLL";

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

export function getTimeDataSummaryFile() {
    let file = getCodeMetryDir();
    if (isWindows()) {
        file += "\\projectTimeData.json";
    } else {
        file += "/projectTimeData.json";
    }
    return file;
}

export function getCodeMetrySummary(): CodeMetrySummary {
    const summary: CodeMetrySummary = new CodeMetrySummary();

    const { day } = getNowTimes();

    // gather the time data elements for today
    const file = getTimeDataSummaryFile();
    const payloads: TimeData[] = getFileDataArray(file);

    const filtered_payloads: TimeData[] = payloads.filter(
        (n: TimeData) => n.day === day
    );

    if (filtered_payloads && filtered_payloads.length) {
        filtered_payloads.forEach((n: TimeData) => {
            summary.activeCodeTimeMinutes += n.session_seconds / 60;
            summary.codeTimeMinutes += n.editor_seconds / 60;
            summary.fileTimeMinutes += n.file_seconds / 60;
        });
    }

    return summary;
}

