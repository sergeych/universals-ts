import { padToSize, trimToSize } from "../string_tools";
import process from "process";

const csi = require('ansi-csi-terminal');
const c = require('ansi-colors');

export type LogType = "error" | "warning" | "log" | "info";

// interface TypedLine {
//   type: LogType;
//   text: string;
// }


export class SimpleTextUI {

  // private logHistory: TypedLine[] = [];
  private progressMessage = "";
  private progressValue = 0;

  private closed = false;

  constructor(exitBoBreak=true) {
    csi.hideCursor();
    process.on("exit", () => this.close());
    if( exitBoBreak ) {
      process.on("SIGINT", () => {
        csi.showCursor(true)
        process.exit(101)
      });
    }
  }

  private redrawProgress() {
    csi.x(1);
    csi.clearLine();
    let w = csi.width();
    let percents = "";
    if (this.progressValue > 0) {
      percents = ` ${Math.floor(this.progressValue * 100)}%`;
      w -= percents.length;
    }
    const text = padToSize(trimToSize(this.progressMessage, w), w) + percents;
    const col = Math.round(w * this.progress);
    if( col <= 1 )
      csi.w(text);
    else {
      csi.w(c.bgWhite.black(text.substring(0, col)))
      csi.w(text.substring(col))
    }
  }

  set progressText(text: string) {
    if (text.indexOf("\n") >= 0) throw new Error("progress message should not contain line ends");
    this.progressMessage = text;
    this.redrawProgress();
  }

  get progressText(): string {
    return this.progressMessage
  }

  set progress(value: number) {
    this.progressValue = value;
    this.redrawProgress();
  }

  get progress(): number {
    return this.progressValue;
  }

  logError(text: string|Error,reason?: Error) {
    if( text instanceof Error && reason)
      throw new Error("only one argument can be an error");
    if( text instanceof Error) {
      text = text?.stack ?? text.message
      reason = undefined;
    }
    if( reason?.stack )
      text += reason?.stack
    this.log(text, "error")
  }

  log(message: string, type: LogType="log") {
    const parts = message.split("\n")
    csi.x(1);
    csi.clearLine();
    for (const text of parts) {
      if (text.trim() !== "") {
        // this.logHistory.push({ text, type })
        let attrs;
        switch (type) {
          case "error":
            attrs = c.redBright;
            break;
          case "warning":
            attrs = c.yellow;
            break;
          case "info":
              attrs = c.cyanBright;
            break;
          default:
            attrs = c.gray;
        }
        csi.w(attrs(trimToSize(text, csi.width()) + "\n"));
      }
    }
    this.redrawProgress()
  }

  close(doneMessage = "") {
    if (!this.closed) {
      csi.showCursor(true);
      this.closed = true;
      csi.x(1);
      csi.clearLine();
      if (doneMessage.trim() != "") {
        csi.w(doneMessage);
        if (doneMessage.indexOf("\n") < 0) csi.w("\n")
      }
    }
  }
}
