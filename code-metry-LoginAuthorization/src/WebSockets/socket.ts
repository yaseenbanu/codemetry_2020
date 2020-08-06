import { getJWT } from "../lib/Loggers";
import { CircularBuffer } from "../lib/Circular_Buffer/circularbuffer";
import * as vscode from "vscode";
import { DEFAULT_SERVER_PING_MESSAGE_DURATION } from "../Constants";
import { circularBuffer, socket } from "../extension";

const fs = require("fs");
const WebSocket = require("ws");

let token = JSON.parse(
  fs.readFileSync(getJWT(), { encoding: "utf-8", flag: "r" })
).jwt;
const url: string = `wss://dqvh31pat6.execute-api.ap-south-1.amazonaws.com/dev?token=${token}`;

let timerID: NodeJS.Timeout;
let timerID2: NodeJS.Timeout;

export class Socket {
  public ws: any;
  private static instance: Socket;

  constructor() {
    this.ws = new WebSocket(url);
    this.ws.on("open", () => {
      console.log("opened");
      timerID = setInterval(
        () => this.keepAlive(),
        DEFAULT_SERVER_PING_MESSAGE_DURATION
      );
      timerID2 = setInterval(async () => {
        (await socket).sendData(circularBuffer);
      }, 1.5 * 60 * 1000);
    });
    this.ws.on("message", (data: any) => {
      // console.log("onMessage", data);
    });
    this.ws.on("error", (error: any) => {
      console.log("error", error);
    });
    this.ws.on("close", () => {
      this.cancelKeepAlive();
      console.log("close");
    });
  }

  keepAlive() {
    if (vscode.window.state.focused) {
      if (this.ws.readyState === this.ws.OPEN) {
        this.ws.send("");
      }
    }
  }

  cancelKeepAlive() {
    if (timerID) {
      clearInterval(timerID);
    }
    if (timerID2) {
      clearInterval(timerID2);
    }
  }

  static async getInstance() {
    if (!Socket.instance) {
      Socket.instance = new Socket();
    }
    return Socket.instance;
  }

  private waitForConnectionToOpen(socket: any) {
    return new Promise((resolve, reject) => {
      const maxNumberOfAttempts = 10;
      const intervalTime = 210; //ms
      let currentAttempt = 0;
      const interval = setInterval(async () => {
        if (currentAttempt > maxNumberOfAttempts - 1) {
          clearInterval(interval);
          reject(new Error("Maximum number of attempts exceeded"));
        } else if (socket.readyState === this.ws.OPEN) {
          clearInterval(interval);
          resolve();
        }
        currentAttempt++;
      }, intervalTime);
    });
  }

  private postData(buffer: CircularBuffer) {
    // console.log("Sending Data");
    // for (let i = 0; i < buffer.memory.length; i++) {
    //     let data = {
    //         "action" : "sendMessage",
    //         "message" : JSON.stringify(buffer.read()),
    //         };
    //     this.ws.send(JSON.stringify(data));
    // }
    let obj;
    let result = [];
    while ((obj = buffer.read()) !== "NO DATA") {
      result.push(obj);
    }
    let data = {
      action: "onMessage",
      message: result,
    };
    this.ws.send(JSON.stringify(data));
  }

  public async sendData(buffer: CircularBuffer) {
    if (this.ws.readyState !== this.ws.OPEN) {
      this.ws = new WebSocket(url);
      await this.waitForConnectionToOpen(this.ws);
    }
    if (this.ws.readyState !== this.ws.OPEN) {
      try {
        await this.waitForConnectionToOpen(this.ws);
        this.postData(buffer);
      } catch (err) {
        console.error(err);
      }
    } else {
      this.postData(buffer);
    }
  }
}

// let ws : any;

// function openSocket() {
//   ws = new WebSocket(url);
// }

// ws.on('open', function open() {
//   console.log('opened');
// });

// ws.on('message', function incoming(data : any) {
//   console.log("onMessage", data);
// });

// ws.on('close', () => {
//     console.log('closed');
// });

// ws.on('error', (data : any) => {
//   console.log("error", data);
// });

// export function sendData(buffer : any) {

//   // buffer.forEach((obj: any) => {
//     console.log("Sending...");
//     let data = {
//       "action" : "onMessage",
//       "message" : buffer,
//     };
//     ws.send(data);
//   // });
//   // setTimeout(() => {
//     console.log("Sending...");
//     let params = {
//       "action" : "onMessage",
//       "message" : "Hello"
//     };
//     ws.send(params);
//   // }, 0);
// }
