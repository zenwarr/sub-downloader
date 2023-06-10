import * as child_process from "child_process";


export function sync(videoPath: string, subPath: string): void {
    child_process.spawnSync("alass", [ videoPath, subPath, subPath ], {
        cwd: process.cwd(),
        stdio: "inherit"
    });
}
