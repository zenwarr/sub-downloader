Interactive command-line utility to download subtitles from opensubtitles.org.

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
This method is used by default by ossub-downloader.
It gives less results, but it is more accurate.
But if you want to search by file name only, you can specify `--use-name` (or its shorthand `-n`) flag:

```shell
npx ossub-downloader --use-name

npx ossub-downloader -n
```
