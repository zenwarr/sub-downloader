Interactive command-line utility to download subtitles from opensubtitles.org.

## Prerequisites

- You need to have an active account on opensubtitles.org, register here: https://www.opensubtitles.org/register/
- You need node.js and npm installed on your system, any version newer than 16 can be used.

## Usage

```shell
npx ossub-downloader --lang=eng
```

If you do not specify value for `--lang`, `eng` is going to be used.
Language should be specified as a [three-letter language code](https://www.loc.gov/standards/iso639-2/php/code_list.php).
You can also use `all` to show all subtitles regardless of language.

By default, `ossub-downloader` searches for video files in the working directory and uses them to search for subtitles.
But you can specify a video file manually:

```shell
npx ossub-downloader --lang=eng video.mp4
```

Opensubtitles allows searching subtitles by file hash.
This method is used by default by `ossub-downloader`.
It gives less results, but it is more accurate.
But if you want to search by file name only, you can specify `--use-name` (or its shorthand `-n`) flag:

```shell
npx ossub-downloader --use-name

npx ossub-downloader -n
```

## Authorization

Opensubtitles API requires authorization.
Upon starting, `ossub-downloader` is going to ask for your username and password.
You can save them into `~/.ossub-downloader.creds.json` file and not be prompted to type them again but it can be insecure, because this file is not encrypted in any way.
