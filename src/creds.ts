import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import prompts from "prompts";


type CredsFileContent = {
    shouldAskForSave: false;
} | Creds;


type Creds = {
    username: string;
    passwordHash: string;
}


/**
 * Get path to saved creds file
 */
function getCredsFilePath() {
    const home = os.homedir();
    return path.join(home, ".ossub-downloader.creds.json");
}


/**
 * Loads saved creds from file
 */
async function loadSavedCreds(): Promise<CredsFileContent | undefined> {
    const credsFilePath = getCredsFilePath();
    if (!fs.existsSync(credsFilePath)) {
        return undefined;
    }

    return JSON.parse(fs.readFileSync(credsFilePath, "utf8"));
}


/**
 * Loads saved creds from file, or prompts user to enter new creds
 */
export async function loadCreds(): Promise<Creds> {
    const loadedCreds = await loadSavedCreds();
    if (loadedCreds && "username" in loadedCreds && "passwordHash" in loadedCreds) {
        return loadedCreds;
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
        }
    ]);

    let shouldSave = false;
    if (!loadedCreds || ("shouldAskForSave" in loadedCreds && loadedCreds.shouldAskForSave)) {
        const result = await prompts([
            {
                type: "toggle",
                name: "save",
                message: `Save credentials in ${getCredsFilePath()}?`,
                initial: false,
                active: "Yes",
                inactive: "No, and don't ask again"
            }
        ]);
        shouldSave = result.save;
    }

    const creds: Creds = {
        username: result.username,
        passwordHash: crypto.createHash("md5").update(result.password).digest("hex")
    };

    let credsToSave: CredsFileContent;
    if (shouldSave) {
        credsToSave = creds;
    } else {
        credsToSave = {
            shouldAskForSave: false
        };
    }

    fs.writeFileSync(getCredsFilePath(), JSON.stringify(credsToSave));

    return creds;
}
