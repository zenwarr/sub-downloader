#!/usr/bin/env node

import * as fs from "fs";
import fetch from "node-fetch";
import * as path from "path";
import prompts from "prompts";
import { args, getWorkContext } from "./src/args.js";
import { findSubtitles, Subtitle } from "./src/subs.js";


async function search() {
  const params = await getWorkContext();
  const subs = await findSubtitles(params.filename, args.lang, args.useName);

  if (!subs.length) {
    console.log("No subtitles found");
    process.exit(1);
  }

  const result = await prompts([
    {
      type: "select",
      name: "subtitle",
      instructions: false,
      message: "Select subtitles to download",
      choices: subs.map(s => ({
        title: `[${ s.langcode }] ${ s.filename } ⇩${ s.downloads }`,
        value: s
      }))
    }
  ]);

  const subToDownload: Subtitle = result.subtitle;
  const res = await fetch(subToDownload.utf8 || subToDownload.url);

  if (!res.body) {
    console.log("Failed to download: empty response body");
    process.exit(1);
  }

  let outputFilename = subToDownload.langcode + ".srt";
  let outputPath = path.join(params.workingDir, outputFilename);
  if (fs.existsSync(outputPath)) {
    // ask user for another name
    const result = await prompts([
      {
        type: "text",
        name: "outputFilename",
        message: "Output file already exists, enter new name (or confirm to overwrite)",
        initial: outputFilename
      }
    ]);
    outputFilename = result.outputFilename.includes(".") ? result.outputFilename : result.outputFilename + ".srt";
    outputPath = path.join(params.workingDir, outputFilename);
  }

  console.log("Saving to " + outputPath);
  const stream = fs.createWriteStream(outputPath, {
    autoClose: true
  });
  res.body.pipe(stream);
}


search();
