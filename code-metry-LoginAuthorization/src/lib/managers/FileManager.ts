import { getCodeMetryDir, isWindows } from "../Loggers";
import fs = require("fs");

export function getCurrentPayloadFile() {

    let file = getCodeMetryDir();
    
    if (isWindows()) {
        file += "\\latestKeystrokes.json";
    } else {
        file += "/latestKeystrokes.json";
    }
    return file;
}

export async function storeCurrentPayload(payload: any) {

    const content = JSON.stringify(payload, null, 4);
    fs.writeFileSync(getCurrentPayloadFile(), content);
        
}
