import fetch from "node-fetch";

const ost = require("opensubtitles-api");
import path from "path";
import {loadCreds} from "./creds";
import fs from "fs";
import prompts from "prompts";
import {defaultPromptCancel} from "./prompts";


export async function initClient() {
    const creds = await loadCreds();
    return new ost({
        useragent: "SMPlayer v22",
        username: creds.username,
        password: creds.passwordHash,
        ssl: true
    });
}


export interface Subtitle {
    langcode: string;
    filename: string;
    downloads: number;
    utf8?: string;
    url: string;
    score?: number;
}


export async function findSubtitles(videoPath: string, lang: string, useName: boolean): Promise<Subtitle[]> {
    const client = await initClient();

    const searchMethod = useName ? "file name" : "file hash";
    console.log(`Searching for subtitles for ${videoPath} (using ${searchMethod})`);

    const queryResult = await client.search({
        sublanguageid: lang,
        path: useName ? undefined : videoPath,
        query: useName ? path.basename(videoPath) : undefined,
        limit: "all"
    });

    const subs: any = [];
    for (const key of Object.keys(queryResult)) {
        subs.push(...queryResult[key]);
    }

    return subs;
}


export interface ConfirmProvider {
    confirmOverwrite(filename: string): Promise<string>;
}


function normalizeFilename(filename: string): string {
    return filename.includes(".") ? filename : filename + ".srt"
}


export async function downloadSubtitle(confirmProvider: ConfirmProvider, subtitle: Subtitle, outputPath: string): Promise<void> {
    outputPath = normalizeFilename(outputPath);

    const res = await fetch(subtitle.utf8 || subtitle.url);
    if (res.status !== 200) {
        throw new Error(`Failed to download subtitle: ${res.statusText}`);
    }

    if (!res.body) {
        throw new Error("Failed to download: empty response body");
    }

    if (fs.existsSync(outputPath)) {
        outputPath = await confirmProvider.confirmOverwrite(outputPath);
        outputPath = normalizeFilename(outputPath);
    }

    console.log("Saving to " + outputPath);
    const stream = fs.createWriteStream(outputPath, {
        autoClose: true
    });
    res.body.pipe(stream);
}
