#!/usr/bin/env node

const ost = require("opensubtitles-api");
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as crypto from "crypto";
import prompts from "prompts";
import fetch from "node-fetch";
import argparse from "argparse";


interface SavedCreds {
  username: string;
  passwordHash: string;
  userAgent: string;
}


/**
 * Get path to saved creds file
 */
function getCredsFilePath() {
  const home = os.homedir();
  return path.join(home, ".sub-downloader.creds.json");
}


/**
 * Loads saved creds from file
 */
async function loadSavedCreds(): Promise<SavedCreds | undefined> {
  const credsFilePath = getCredsFilePath();
  if (!fs.existsSync(credsFilePath)) {
    return undefined;
  }

  return JSON.parse(fs.readFileSync(credsFilePath, "utf8"));
}


/**
 * Loads saved creds from file, or prompts user to enter new creds
 */
async function loadCreds(): Promise<SavedCreds> {
  const creds = await loadSavedCreds();
  if (creds) {
    return creds;
  }

  const result = await prompts([
    {
      type: "text",
      name: "username",
      message: "Username"
    },
    {
      type: "password",
      name: "password",
      message: "Password"
    },
    {
      type: "text",
      name: "userAgent",
      message: "User agent (https://trac.opensubtitles.org/projects/opensubtitles/wiki/DevReadFirst)"
    }
  ]);

  const credsToSave: SavedCreds = {
    username: result.username,
    passwordHash: crypto.createHash("md5").update(result.password).digest("hex"),
    userAgent: result.userAgent
  };

  fs.writeFileSync(getCredsFilePath(), JSON.stringify(credsToSave));

  return credsToSave;
}


async function initClient() {
  const creds = await loadCreds();
  return new ost({
    useragent: creds.userAgent,
    username: creds.username,
    password: creds.passwordHash,
    ssl: true
  });
}


/**
 * Lists all movie files in current working directory and prompts user to select one
 */
async function selectMovieFileInDir(dir: string): Promise<string> {
  const files = fs.readdirSync(dir);
  const movieFiles = files.filter((file: string) => {
    const filePath = path.join(dir, file);
    return fs.statSync(filePath).isFile() && hasMovieExtension(filePath);
  });

  if (movieFiles.length === 0) {
    console.log("No movie files found in directory " + dir);
    process.exit(1);
  }

  const result = await prompts([
    {
      type: "select",
      name: "filename",
      instructions: false,
      message: "Select movie files to download subtitles for",
      choices: movieFiles.map((file: string) => {
        return {
          title: file,
          value: file
        };
      })
    }
  ]);

  return result.filename;
}


const VIDEO_FILE_EXTENSIONS = [ ".mp4", ".mkv", ".avi", ".mov" ];

function hasMovieExtension(filename: string): boolean {
  const ext = path.extname(filename);
  return VIDEO_FILE_EXTENSIONS.includes(ext);
}


interface Parameters {
  workingDir: string;
  filename: string;
}


const argParser = new argparse.ArgumentParser({
  description: "Subtitle downloader for opensubtitles.net"
});

argParser.add_argument("--lang", {
  help: "Language to search for",
  dest: "lang",
  default: "eng"
});

argParser.add_argument("filename", {
  help: "Movie file to search for subtitles for",
  nargs: "?"
});

const args = argParser.parse_args();


async function getParameters(): Promise<Parameters> {
  if (args.filename) {
    return {
      workingDir: path.dirname(args.filename),
      filename: args.filename
    };
  } else {
    const filename = await selectMovieFileInDir(process.cwd());
    return {
      workingDir: path.dirname(filename),
      filename: filename
    };
  }
}


async function search() {
  const params = await getParameters();

  const client = await initClient();

  const queryResult = await client.search({
    sublanguageid: args.lang,
    path: params.filename,
    limit: "all"
  });

  const subs: any = [];
  for (const key of Object.keys(queryResult)) {
    subs.push(...queryResult[key]);
  }

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
      choices: subs.map((s: any) => ({
        title: `[${ s.langcode }] ${ s.filename } ⇩${ s.downloads }`,
        value: s
      }))
    }
  ]);

  const subToDownload = result.subtitle;
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
