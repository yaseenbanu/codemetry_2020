import Project from "./Project";
import { FileChangeInfo } from "./models";
import { getOs } from "../../Util";
import { getJWT } from "../Loggers";
const fs = require('fs');

export default class KeystrokeStats {
    
    public source : { [key: string]: any } = {};
    public keystrokes: number = 0;
    public project: Project;
    public os: string;
    google_id : string = JSON.parse(fs.readFileSync(getJWT(), {encoding:'utf-8', flag:'r'})).jwt;
    timestamp : string = '';
    
    constructor(project: Project) {
        this.source = {};
        this.keystrokes = 0;
        this.project = project;
        this.os = getOs();
    }

    getCurrentStatsData() {
        return JSON.parse(JSON.stringify(this));
    }

    /**
     * check if the payload should be sent or not
     */
    hasData() {
        const keys = Object.keys(this.source);
        if (!keys || keys.length === 0) {
            return false;
        }

        // delete files that don't have any kpm data
        let foundKpmData = false;
        if (this.keystrokes > 0) {
            foundKpmData = true;
        }

        let keystrokesTally = 0;
        // keys.forEach((key) => {
        //     const data: FileChangeInfo = this.source[key];

        //     data.keystrokes =
        //         data.add +
        //         data.paste +
        //         data.delete +
        //         data.linesAdded +
        //         data.linesRemoved;
        //     const hasKeystrokes = data.keystrokes > 0;
        //     keystrokesTally += data.keystrokes;
        // });

        if (keystrokesTally > 0 && keystrokesTally !== this.keystrokes) {
            // use the keystrokes tally
            foundKpmData = true;
            this.keystrokes = keystrokesTally;
        }
        return foundKpmData;
    }
}