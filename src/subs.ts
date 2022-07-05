const ost = require("opensubtitles-api");
import path from "path";
import { loadCreds } from "./creds";


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
}


export async function findSubtitles(videoPath: string, lang: string, useName: string): Promise<Subtitle[]> {
  const client = await initClient();

  const searchMethod = useName ? "file name" : "file hash";
  console.log(`Searching for subtitles for ${ videoPath } (using ${ searchMethod })`);

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
