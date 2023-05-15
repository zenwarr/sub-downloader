#!/usr/bin/env node

import prompts from "prompts";
import {args, getWorkContext} from "./src/args";
import {defaultPromptCancel} from "./src/prompts";
import {downloadSubtitle, findSubtitles, Subtitle} from "./src/subs";


async function search() {
    const params = await getWorkContext();
    const subs = await findSubtitles(params.filename, args.lang, args.useName);

    if (!subs.length) {
        console.log("No subtitles found");
        process.exit(1);
    }

    const result = await prompts([
        {
            type: "multiselect",
            name: "subtitles",
            instructions: false,
            message: "Select subtitles to download",
            choices: subs.map(s => ({
                title: `[${s.langcode}] ${s.filename} ⇩${s.downloads} ⭐${s.score || "?"}`,
                value: s
            }))
        }
    ], {onCancel: defaultPromptCancel});

    const subsToDownload: Subtitle[] = result.subtitles;
    for (const subToDownload of subsToDownload) {
        await downloadSubtitle({
            async confirmOverwrite(filename: string): Promise<string> {
                const result = await prompts([
                    {
                        type: "text",
                        name: "outputFilename",
                        message: "Output file already exists, enter new name (or confirm to overwrite)",
                        initial: filename
                    }
                ], {onCancel: defaultPromptCancel});

                return result.outputFilename;
            }
        }, subToDownload, subToDownload.filename);
    }
}


search();
