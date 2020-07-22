import { getCodeMetryDir, isWindows } from "../Loggers";
import fs = require("fs");
const path = require("path");

export async function getCurrentPayloadFile() {

    let file = getCodeMetryDir();
    file = path.join(file, "latestKeystrokes.json");

    // if (isWindows()) {
    //     file += "\\latestKeystrokes.json";
    // } else {
    //     file += "/latestKeystrokes.json";
    // }

    return file;
}

export async function storeCurrentPayload(payload: any) {
    console.log(" storeCurrentPayload ");
    console.log(payload)
    const content = JSON.stringify(payload, null, 4);
    fs.writeFileSync(await getCurrentPayloadFile(), content);
}
