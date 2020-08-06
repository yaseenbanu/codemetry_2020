import { getCompilerLog } from "./Loggers";
import { getCurrentPayloadFile } from "./managers/FileManager";

const fs = require("fs");
var graderLine = "";

export async function captureAutogradeLogs(data : string) {

    let json = JSON.parse(fs.readFileSync(getCurrentPayloadFile(), {encoding:'utf8', flag:'r'}));
    // let data = fs.readFileSync(getCompilerLog(), 'utf8');

    const lines = data.split(/\r?\n/);

    for (let index = 0; index < lines.length; index++) {
    
        let line = lines[index];
    
        if (line.includes('passed') && (line.includes("=========="))){
            graderLine = line;
            break;
        }
    
        if (line.includes('failed') && (line.includes("=========="))){
            graderLine = line;
            break;
        }
    };

    var numberPattern = /\d+/g;
    const loglist = graderLine.match(numberPattern);

    if (loglist !== null) {

        if (graderLine.includes(",")){
       
            json.failedTestCases = parseInt(loglist[0]);
            json.passedTestCases = parseInt(loglist[1]);
            fs.writeFileSync(getCurrentPayloadFile(), JSON.stringify(json, null, 4));
       
        } else {

            if (graderLine.includes("passed")) { 
                json.passedTestCases = parseInt(loglist[0]);
                fs.writeFileSync(getCurrentPayloadFile(), JSON.stringify(json, null, 4));
            }
            
            if (graderLine.includes("failed")) {
                json.failedTestCases = parseInt(loglist[0]);
                fs.writeFileSync(getCurrentPayloadFile(), JSON.stringify(json, null, 4));
            }
        }
    }
}