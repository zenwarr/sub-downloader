import fs from "fs";
import path from "path";
import prompts from "prompts";
import { defaultPromptCancel } from "./prompts";


/**
 * Lists all video files in current working directory and prompts user to select one
 */
export async function selectVideoFileInDir(dir: string): Promise<string> {
  const files = fs.readdirSync(dir);
  const videoFiles = files.filter((file: string) => {
    const filePath = path.join(dir, file);
    return fs.statSync(filePath).isFile() && hasVideoExtension(filePath);
  });

  if (videoFiles.length === 0) {
    console.log("No video files found in directory " + dir);
    process.exit(1);
  } else if (videoFiles.length === 1) {
    return path.join(dir, videoFiles[0]);
  }

  const result = await prompts([
    {
      type: "select",
      name: "filename",
      instructions: false,
      message: "Select video files to download subtitles for",
      choices: videoFiles.map((file: string) => {
        return {
          title: file,
          value: file
        };
      })
    }
  ], { onCancel: defaultPromptCancel });

  return result.filename;
}


const VIDEO_FILE_EXTENSIONS = [ ".mp4", ".mkv", ".avi", ".mov" ];


function hasVideoExtension(filename: string): boolean {
  const ext = path.extname(filename);
  return VIDEO_FILE_EXTENSIONS.includes(ext);
}
