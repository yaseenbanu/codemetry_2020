import { Disposable, workspace, window } from "vscode";
import {
  getRootPathForFile,
  isFileActive,
  getFileAgeInDays,
  getFileType,
  getNowTimes,
  isEmptyObj,
} from "../../Util";
import { FileChangeInfo } from "../models/models";
import Project from "../models/Project";
import KeystrokeStats from "../models/KeystrokeStats";
import { NO_PROJ_NAME } from "../../Constants";
// import { storeCurrentPayload } from "./FileManager";

import { circularBuffer, socket } from "../../extension";

let _keystrokeMap: { [key: string]: any } = {};
let _staticInfoMap: { [key: string]: any } = {};

export class KpmManager {
  private static instance: KpmManager;
  private _disposable: Disposable;
  // private _currentPayloadTimeout: any;

  constructor() {
    let subscriptions: Disposable[] = [];
    workspace.onDidOpenTextDocument(this._onOpenHandler, this);
    workspace.onDidChangeTextDocument(this._onEventHandler, this);
    this._disposable = Disposable.from(...subscriptions);
  }

  static getInstance(): KpmManager {
    if (!KpmManager.instance) {
      KpmManager.instance = new KpmManager();
    }

    return KpmManager.instance;
  }

  public clear() {
    _keystrokeMap = {};
  }

  public dispose() {
    this._disposable.dispose();
  }

  private async _onOpenHandler(event: any) {
    if (!event || !window.state.focused) {
      return;
    }

    const filename = this.getFileName(event);

    if (!this.isTrueEventFile(event, filename)) {
      return;
    }

    const staticInfo = await this.getStaticEventInfo(event, filename);

    let rootPath = getRootPathForFile(staticInfo.filename);

    if (!rootPath) {
      return;
    }

    await this.initializeKeystrokesCount(staticInfo.filename, rootPath);

    // make sure other files end's are set
    this.endPreviousModifiedFiles(staticInfo.filename, rootPath);
  }

  // Text document Change Handler Function

  private async _onEventHandler(event: any) {
    if (!event || !window.state.focused) {
      return;
    }

    const filename = this.getFileName(event);

    if (!this.isTrueEventFile(event, filename)) {
      return;
    }
    const staticInfo = await this.getStaticEventInfo(event, filename);

    let rootPath = getRootPathForFile(filename);

    if (!rootPath) {
      return;
    }

    await this.initializeKeystrokesCount(filename, rootPath);

    if (!_keystrokeMap[rootPath].source[filename]) {
      // it's undefined, it wasn't created
      return;
    }

    const sourceObj: FileChangeInfo = new FileChangeInfo();
    sourceObj.projectDir = rootPath;
    sourceObj.syntax = staticInfo.languageId;
    sourceObj.fileName = filename;

    const timestamp = new Date(Date.now()).toString();

    sourceObj.keyStrokeTimeStamp = timestamp;

    const currLineCount =
      event.document && event.document.lineCount
        ? event.document.lineCount
        : event.lineCount || 0;

    // Use the contentChanges to figure out most of the events

    let linesAdded = 0;
    let linesDeleted = 0;
    let textChangeLen = 0;
    let rangeChangeLen = 0;
    let contentText = "";
    let isCharDelete = false;

    if (event.contentChanges && event.contentChanges.length) {
      for (let i = 0; i < event.contentChanges.length; i++) {
        const range = event.contentChanges[i].range;

        const row = range._start.line + 1;
        const col = range._start.character + 1;
        sourceObj.position = `${row},${col}`;

        rangeChangeLen += event.contentChanges[i].rangeLength || 0;
        contentText = event.contentChanges[i].text;
        sourceObj.keyStrokeInfo = contentText;

        const newLineMatches = contentText.match(/[\n\r]/g);

        if (newLineMatches && newLineMatches.length) {
          // it's a new line
          linesAdded = newLineMatches.length;

          if (contentText) {
            textChangeLen += contentText.length;
          }

          contentText = "";
        } else if (contentText.length > 0) {
          textChangeLen += contentText.length;
        } else if (range && !range.isEmpty && !range.isSingleLine) {
          if (range.start && range.start.line && range.end && range.end.line) {
            linesDeleted = Math.abs(range.start.line - range.end.line);
          } else {
            linesDeleted = 1;
          }
          sourceObj.delete = true;
          sourceObj.lines = linesDeleted;
        } else if (rangeChangeLen && rangeChangeLen > 0 && contentText === "") {
          isCharDelete = true;
          sourceObj.delete = isCharDelete;
        }
      }
    }

    // check if its a character deletion
    if (textChangeLen === 0 && rangeChangeLen > 0) {
      // since new count is zero, check the range length.
      // if there's range length then it's a deletion
      textChangeLen = event.contentChanges[0].rangeLength / -1;
    }

    if (
      !isCharDelete &&
      textChangeLen === 0 &&
      linesAdded === 0 &&
      linesDeleted === 0
    ) {
      return;
    }

    if (textChangeLen > 8) {
      // it's a copy and paste event
      const range = event.contentChanges["0"].range;
      contentText = event.contentChanges["0"].text;
      const row = range._start.line + 1;
      const col = range._start.character + 1;
      sourceObj.position = `${row},${col}`;
      sourceObj.paste = true;
      contentText = contentText.trim().replace(/(\r\n|\n|\r)/gm, "$");
      const li = contentText.split("$");
      sourceObj.lines = li.length;
    }

    // this.updateLatestPayloadLazily(rootObj);
    circularBuffer.write(sourceObj);
    if (circularBuffer.isFull === true) {
      // console.log(circularBuffer);
      (await socket).sendData(circularBuffer);
    }
  }

  // private updateLatestPayloadLazily(payload: any) {

  //     if (this._currentPayloadTimeout) {
  //         // cancel the current one
  //         clearTimeout(this._currentPayloadTimeout);
  //         this._currentPayloadTimeout = null;
  //     }
  //     this._currentPayloadTimeout = setTimeout(() => {
  //         this.updateLatestPayload(payload);
  //     }, 2000);
  // }

  // private updateLatestPayload(payload: any) {
  //         storeCurrentPayload(payload);
  // }

  private getFileName(event: {
    fileName: string;
    document: { fileName: string };
  }) {
    let filename = "";
    if (event.fileName) {
      filename = event.fileName;
    } else if (event.document && event.document.fileName) {
      filename = event.document.fileName;
    }
    return filename;
  }

  private isTrueEventFile(
    event: { uri: { scheme: string }; document: { uri: { scheme: string } } },
    filename: string
  ) {
    if (!filename) {
      return false;
    }
    // if it's the dashboard file or a liveshare tmp file then
    // skip event tracking

    let scheme = "";
    if (event.uri && event.uri.scheme) {
      scheme = event.uri.scheme;
    } else if (
      event.document &&
      event.document.uri &&
      event.document.uri.scheme
    ) {
      scheme = event.document.uri.scheme;
    }

    const isLiveshareTmpFile = filename.match(
      /.*\.code-workspace.*vsliveshare.*tmp-.*/
    );
    const isInternalFile = filename.match(
      /.*\.codemetry.*(compilerLog\.txt|gitToken\.json|latestKeystrokes\.json|sessionSummary\.json)/
    );

    // if it's not active or a liveshare tmp file or internal file or not the right scheme
    // then it's not something to track
    if (
      (scheme !== "file" && scheme !== "untitled") ||
      isLiveshareTmpFile ||
      isInternalFile ||
      !isFileActive(filename)
    ) {
      return false;
    }

    return true;
  }

  private async getStaticEventInfo(
    event: {
      fileName: any;
      languageId: string;
      getText: () => { (): any; new (): any; length: number };
      lineCount: number;
      document: {
        fileName: any;
        languageId: string;
        getText: () => { (): any; new (): any; length: number };
        lineCount: number;
      };
    },
    filename: string
  ) {
    let languageId = "";
    let length = 0;
    let lineCount = 0;

    // get the filename, length of the file, and the languageId
    if (event.fileName) {
      if (event.languageId) {
        languageId = event.languageId;
      }
      if (event.getText()) {
        length = event.getText().length;
      }
      if (event.lineCount) {
        lineCount = event.lineCount;
      }
    } else if (event.document && event.document.fileName) {
      if (event.document.languageId) {
        languageId = event.document.languageId;
      }
      if (event.document.getText()) {
        length = event.document.getText().length;
      }

      if (event.document.lineCount) {
        lineCount = event.document.lineCount;
      }
    }

    let staticInfo = _staticInfoMap[filename];

    if (staticInfo) {
      return staticInfo;
    }

    // get the age of this file
    const fileAgeDays = getFileAgeInDays(filename);

    // if the languageId is not assigned, use the file type
    if (!languageId && filename.indexOf(".") !== -1) {
      let fileType = getFileType(filename);
      if (fileType) {
        languageId = fileType;
      }
    }

    staticInfo = {
      filename,
      languageId,
      length,
      fileAgeDays,
      lineCount,
    };

    _staticInfoMap[filename] = staticInfo;

    return staticInfo;
  }

  private async initializeKeystrokesCount(filename: string, rootPath: string) {
    // if (rootPath === null) {
    //     return;
    // }
    // the rootPath (directory) is used as the map key, must be a string
    rootPath = rootPath || NO_PROJ_NAME;
    // if we don't even have a _keystrokeMap then create it and take the
    // path of adding this file with a start time of now
    if (!_keystrokeMap) {
      _keystrokeMap = {};
    }

    const nowTimes = getNowTimes();

    let keystrokeStats = _keystrokeMap[rootPath];

    // create the keystroke count if it doesn't exist
    if (!keystrokeStats) {
      // add keystroke count wrapper
      keystrokeStats = await this.createKeystrokeStats(
        filename,
        rootPath,
        nowTimes
      );
    }

    // check if we have this file or not
    const hasFile = keystrokeStats.source[filename];

    if (!hasFile) {
      // no file, start a new
      this.addFile(filename, keystrokeStats);
    }

    _keystrokeMap[rootPath] = keystrokeStats;
  }

  private addFile(
    filename: string,
    keystrokeStats: { source: { [x: string]: any } }
  ) {
    const timestamp = new Date(Date.now()).toString();
    const fileInfo = new FileChangeInfo();
    fileInfo.keyStrokeTimeStamp = timestamp;
    keystrokeStats.source[filename] = fileInfo;
  }

  private endPreviousModifiedFiles(filename: string, rootPath: string) {
    let keystrokeStats = _keystrokeMap[rootPath];
    if (keystrokeStats) {
      // close any existing
      const fileKeys = Object.keys(keystrokeStats.source);
      const nowTimes = getNowTimes();
    }
  }

  // private updateStaticValues(payload: { source: { [x: string]: any; }; },
  //     staticInfo: { filename: string | number; languageId: any; fileAgeDays: any; length: any; }) {

  //     const sourceObj: FileChangeInfo = payload.source[staticInfo.filename];

  //     if (!sourceObj) {
  //         return;
  //     }

  //     // syntax
  //     if (!sourceObj.syntax) {
  //         sourceObj.syntax = staticInfo.languageId;
  //     }
  // }

  private async createKeystrokeStats(
    filename: string | number,
    rootPath: string,
    nowTimes: {
      now?: import("moment").Moment;
      now_in_sec: any;
      offset_in_sec?: number;
      local_now_in_sec: any;
      utcDay?: string;
      day?: string;
      localDayTime?: string;
    }
  ) {
    // start off with an empty project
    const p: Project = new Project();
    const keystrokeStats: KeystrokeStats = new KeystrokeStats(p);

    // keystrokeStats.start = nowTimes.now_in_sec;
    // keystrokeStats.local_start = nowTimes.local_now_in_sec;
    keystrokeStats.keystrokes = 0;
    keystrokeStats.project.directory = rootPath;

    // start the minute timer to send the data
    // setTimeout(() => {
    //     this.sendKeystrokeDataIntervalHandler();
    // }, DEFAULT_DURATION_MILLIS);

    return keystrokeStats;
  }

  public hasKeystrokeData() {
    return _keystrokeMap &&
      !isEmptyObj(_keystrokeMap) &&
      Object.keys(_keystrokeMap).length
      ? true
      : false;
  }
  public async sendKeystrokeDataIntervalHandler() {
    //
    // Go through all keystroke count objects found in the map and send
    // the ones that have data (data is greater than 1), then clear the map
    //
    if (this.hasKeystrokeData()) {
      let keys = Object.keys(_keystrokeMap);
      // use a normal for loop since we have an await within the loop
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const keystrokeStats = _keystrokeMap[key];

        const hasData = keystrokeStats.hasData();

        if (hasData) {
          // post the payload offline until the batch interval sends it out
          setTimeout(() => keystrokeStats.postData(), 0);
        }
      }
    }

    // clear out the keystroke map
    _keystrokeMap = {};

    // clear out the static info map
    _staticInfoMap = {};
  }
}
