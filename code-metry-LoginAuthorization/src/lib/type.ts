import { getCompilerLog } from "./Loggers";
import { getCurrentPayloadFile, storeCurrentPayload } from "./managers/FileManager";
import { eventNames } from "process";
import * as vscode from 'vscode';
import { Console } from "console";

const fs = require("fs");

export async function captureAutogradeLogs(data: string) {
    var passedCount = 0;
    var failedCount = 0;
    var graderLine = "";
    var C_compilerErrorName = "";
    var C_compileErrorcount = 0;
    var err = 0;
    var check = true;
    let json = await JSON.parse(await fs.readFileSync(await getCurrentPayloadFile(), { encoding: 'utf8', flag: 'r' }));
    let before = await JSON.parse(await fs.readFileSync(await getCurrentPayloadFile(), { encoding: 'utf8', flag: 'r' }));
    // let data = fs.readFileSync(getCompilerLog(), 'utf8');
    // console.log("TINK0");
    const lines = data.split(/\r?\n/);

    for (let index = 0; index < lines.length; index++) {
        let line = lines[index];
        const errorLine = line.match(/\S.Error/g);
        // console.log(line, "---", errorLine);

        if (errorLine !== null) {
            const notTest = line.match(/Assertion/g);
            if (notTest === null) {
                // console.log(errorLine);
                // console.log("ERROR LINE");
                check = false;
                C_compilerErrorName = line.split(":")[0];
                C_compileErrorcount = 1;
                break;
            }
        }
        if (line.includes('passed') && (line.includes("=========="))) {
            graderLine = line;
            // check = true;
            break;
        }
        if (line.includes('failed') && (line.includes("=========="))) {
            graderLine = line;
            // check = true;
            break;
        }
    };
    var numberPattern = /\d+/g;
    const loglist = graderLine.match(numberPattern);
    // console.log("chechk = ", check)
    if (check === false) {
        json.C_compilerErrorName = C_compilerErrorName;
        json.compileTimeErrors = C_compileErrorcount;
        json.passedTestCases = 0;
        json.failedTestCases = 0;
        // console.log(json);
        // let data = JSON.stringify(json, null, 4);
        // console.log(data);
        // console.log("JSON FIND ME!!");
        // await fs.writeFileSync(await getCurrentPayloadFile(), data);
        // await storeCurrentPayload(json);

    }
    if (loglist !== null) {
        if (graderLine.includes(",")) {
            failedCount = parseInt(loglist[0]);
            json.failedTestCases = parseInt(loglist[0]);
            json.passedTestCases = parseInt(loglist[1]);
            // await fs.writeFileSync(await getCurrentPayloadFile(), JSON.stringify(json, null, 4));
            // await storeCurrentPayload(json);
        }
        else {
            if (graderLine.includes("passed")) {
                json.passedTestCases = parseInt(loglist[0]);
                // await fs.writeFileSync(await getCurrentPayloadFile(), JSON.stringify(json, null, 4));
                // await storeCurrentPayload(json);

            }
            if (graderLine.includes("failed")) {
                json.failedTestCases = parseInt(loglist[0]);
                // await fs.writeFileSync(await getCurrentPayloadFile(), JSON.stringify(json, null, 4));
                // await storeCurrentPayload(json);

            }
        }
    }
    // console.log(" ====== before ====== ");
    // console.log(before);
    // console.log(" ====== after ====== ");
    // console.log(json);

    await storeCurrentPayload(json);
}
