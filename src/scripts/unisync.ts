#!/usr/bin/env node
// noinspection HtmlUnknownTag

import { Command } from 'commander';
import { SimpleTextUI } from "./text_ui";
import * as process from "process";
import { BlockMap } from "../blockmap/BlockMap";
import { readFileData, readFileSource } from "../ubio/readFileSource";
import { writeFileSink } from "../ubio/writeFileSink";
import * as fs from "fs";
import { buildSyncSequence } from "../blockmap/Synchronizer";
import { use } from "../ubio/AsyncClosable";
import { compactStringValue, humanByteSize } from "../string_tools";

const tui = new SimpleTextUI();

function abort(text: string, ex?: Error) {
  tui.logError("abort: " + text, ex);
  process.exit(1000);
}

function exit(text?: string, code?: number) {
  tui.close(text);
  process.exit(code);
}

if (!Command) abort("Can't found support for executable tools, abortin");

const program = new Command();

program
  .option("-c, --create", "build new unimap block file")
  .option("-t, --test", "test existing file and blockmap")
  .option("-s, --blockSize <length>", "set block size for new blockmap, use with -c", "4096")
  .option("--hash <type>", "use specific hash with -c (valud values are sha3_256 or sha_256)", "sha3_256")

program.parse(process.argv);
const opts = program.opts();

const startedAt = Date.now();

function reportElapsed() {
  tui.log(`elapsed time: ${((Date.now() - startedAt) / 1000).toFixed(2)}`);
}

async function buildMap() {
  if (program.args.length == 0) abort("expected at least one input file");
  for (const name of program.args) {
    try {
      tui.progressText = "building map for " + name;
      tui.log("scanning " + name + " blockSize is " + opts.blockSize + " using hash " + opts.hash);
      const ss = await fs.promises.stat(name);
      const map = await BlockMap.scan((await readFileSource(name)).readBinary(), +opts.blockSize,
        opts.hash, s => {
          tui.progressText = `Scanning ${humanByteSize(s)} of ${humanByteSize(ss.size)}`;
          tui.progress = (s / ss.size);
        });
      tui.log(`building block file, ${map.blocks.length} blocks`);
      tui.progressText = "Writing block file..."
      const mapFile = writeFileSink(name + ".ubmap").writeData();
      await map.writeTo(mapFile)
      await mapFile.close();
      reportElapsed();
    } catch (x) {
      tui.logError(x);
      tui.log(`failed to process ${name}`, "warning")
    }
    exit("done");
  }
}

async function pathExists(pathExists: string): Promise<boolean> {
  try {
    await fs.promises.access(pathExists);
    return true;
  } catch (e: any) {
    if (e.code == 'NOENT') return false;
    throw e;
  }
}

async function testMap() {
  if (program.args.length == 0) abort("expected at least one input file");
  for (const name of program.args) {
    try {
      const bmName = name.endsWith(".ubmap") ? name : name + ".ubmap";
      tui.progressText = "Checking blockmap " + bmName;
      tui.log("scanning file " + bmName);
      const map = await use(await readFileData(bmName), s => BlockMap.readFrom(s));
      tui.log(`${bmName}: blockmap, ${map.blocks.length} blocks, hash type ${map.hashType}, block size ${map.blockSize}`);

      const fileName = bmName.substr(0, bmName.length - 6);
      if (await pathExists(fileName)) {
        tui.log("existing file found: " + fileName);
        const steps = await buildSyncSequence(map, (await readFileSource(fileName)).readBinary(),
          (ready, total) => {
            tui.progressText = `Scanning ${humanByteSize(ready)} of ${humanByteSize(total)}`
            tui.progress = ready / total;
          });
        if (steps.length == 1 && steps[0].type == "existing")
          tui.log(`Source: ${fileName} matches blockmap ${bmName}`, "info");
        else {
          let upload = 0;
          let copy = 0;
          for (const s of steps) {
            const size = s.to - s.from
            if (s.type == "existing")
              copy += size;
            else {
              tui.log(`required upload: ${s.from}...${s.to}`);
              upload += size;
            }
          }
          tui.log(`File is ${compactStringValue(upload / map.length * 100)}% different, ${humanByteSize(upload)} to upload`,
            "info");
        }
      } else {
        tui.log("existing file is not found: " + fileName, "warning")
      }
      reportElapsed();
    } catch (x) {
      tui.logError(x);
      tui.log(`failed to process ${name}`, "warning")
    }
  }
}

if (opts.create) {
  buildMap().then();
} else if (opts.test) {
  testMap().then();
} else
  abort("nothing to do. use '-h' for help");
// async function test() {
//   tui.progressText = "Initializing....";
//   for (let i = 0; i <= 10; i++) {
//     tui.progress = i/10;
//     await timeout(40);
//     tui.log("line " + i, ["info", "warning", "error", "log"][i % 4] as LogType);
//   }
// }

// test();



