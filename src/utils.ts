import { Clipboard, Toast, getPreferenceValues, open, showHUD } from "@raycast/api";
import crypto from "crypto";
import { formatDuration, intervalToDuration } from "date-fns";
import path from "path";
import YTDlpWrap from "yt-dlp-wrap";
import { DownloadOptions, FormatOptions } from "./interfaces";

export const isValidUrl = (url: string | undefined) => {
    if(!url)
        return false;
    const urlPattern = /^(ftp|http|https):\/\/[^ "]+$/;
    return urlPattern.test(url);
};

export const preferences = getPreferenceValues<{
  downloadPath: string;
  ytdlpBinaryPath: string;
}>();

  
export const download = (url: string, options: DownloadOptions) => {
    const formatObject: FormatOptions = JSON.parse(options.format);
  
    const toast = new Toast({
      title: "Downloading",
      message: "0%",
      style: Toast.Style.Animated,
    });

    toast.show();
  
    const ytdlp = new YTDlpWrap(preferences.ytdlpBinaryPath);

    const filePath = `${preferences.downloadPath}/${crypto.randomUUID()}.%(ext)s`

    const args = [
        url,
        '-f',
        formatObject.itag,
        '-o',
        filePath,
    ]

    if(options.startTime || options.endTime)
    {
        args.push(`--postprocessor-args "-ss ${options.startTime || "00:00:00"}${options.endTime ? ` -to ${options.endTime}` : ""}"`)
    }

    let ytDlpEventEmitter = ytdlp.exec(args)
    .on('progress', (progress) => {
        console.log(
            progress.percent,
            progress.totalSize,
            progress.currentSpeed,
            progress.eta
        )

        toast.message = `${progress.percent}%`;
    }
    )
    .on('ytDlpEvent', (eventType, eventData) =>
        console.log(eventType, eventData)
    )
    .on('error', (error) => {
        console.log(error)

        toast.title = "Download Failed";
        toast.style = Toast.Style.Failure;
        toast.message = "Please try again later.";

    })
    .on('close', () => {
        
        toast.title = "Download Complete";
        toast.message = url;
        toast.style = Toast.Style.Success;
        toast.primaryAction = {
          title: "Open in Finder",
          shortcut: { modifiers: ["cmd", "shift"], key: "o" },
          onAction: () => {
            open(path.dirname(filePath));
          },
        };
        toast.secondaryAction = {
          title: "Copy to Clipboard",
          shortcut: { modifiers: ["cmd", "shift"], key: "c" },
          onAction: () => {
            Clipboard.copy({ file: filePath });
            showHUD("Copied to Clipboard");
          },
        };
    });
};
export function formatHHMM(seconds: number): string {
    const duration = intervalToDuration({ start: 0, end: seconds * 1000 });
    
    const formattedDuration = formatDuration(duration, {
      format: ["minutes", "seconds"],
      zero: true,
      delimiter: ":",
      locale: {
        formatDistance: (_token, count) => String(count).padStart(2, "0"),
      },
    });
  
    return formattedDuration;
  }
  export function parseHHMM(input: string): number {
    const parts = input.split(":");
    
    if (parts.length !== 2 && parts.length !== 3) {
      throw new Error("Invalid input");
    }
  
    const [hours, minutes, seconds = "0"] = parts.map(part => parseInt(part));
  
    if (isNaN(hours) || isNaN(minutes) || isNaN(+seconds)) {
      throw new Error("Invalid input");
    }
  
    return (hours || 0) * 60 * 60 + minutes * 60 + (+seconds);
  }
  
  
  export function isValidHHMM(input: string) {
    try {
      if (input) {
        parseHHMM(input);
      }
      return true;
    } catch {
      return false;
    }
  }