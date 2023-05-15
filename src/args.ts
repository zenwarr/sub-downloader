import argparse from "argparse";
import path from "path";
import {selectVideoFileInDir} from "./video";


export interface WorkContext {
    workingDir: string;
    filename: string;
}


export const argParser = new argparse.ArgumentParser({
    description: "Subtitle downloader for opensubtitles.net"
});

argParser.add_argument("--lang", "-l", {
    help: "Language to search for",
    dest: "lang",
    default: "eng"
});

argParser.add_argument("--use-name", "-n", {
    help: "Search using movie file name instead of movie file hash (more results, but less accurate)",
    dest: "useName",
    action: "store_true",
    default: false
});

argParser.add_argument("--multi", "-m", {
    help: "Download multiple subtitles",
    dest: "multi",
    action: "store_true",
    default: false
})

argParser.add_argument("filename", {
    help: "Movie file to search for subtitles for",
    nargs: "?"
});


export const args = argParser.parse_args();


export async function getWorkContext(): Promise<WorkContext> {
    if (args.filename) {
        return {
            workingDir: path.dirname(args.filename),
            filename: args.filename
        };
    } else {
        const filename = await selectVideoFileInDir(process.cwd());
        return {
            workingDir: path.dirname(filename),
            filename: filename
        };
    }
}
