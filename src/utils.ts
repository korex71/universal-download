import { Clipboard, Toast, getPreferenceValues, open, showHUD } from "@raycast/api";
import { formatDuration, intervalToDuration } from "date-fns";
import path from "path";
import YTDlpWrap from "yt-dlp-wrap";
import { DownloadOptions, FormatOptions } from "./interfaces";

export const isValidUrl = (url: string | undefined) => {
  if (!url) return false;
  const urlPattern = /^(ftp|http|https):\/\/[^ "]+$/;
  return urlPattern.test(url);
};

export const preferences = getPreferenceValues<{
  downloadPath: string;
  ytdlpBinaryPath: string;
}>();

export const download = (url: string, options: DownloadOptions) => {
  return new Promise((resolve, reject) => {
    const formatObject: FormatOptions = JSON.parse(options.format);

  const toast = new Toast({
    title: `Downloading ${formatObject.type == "V" ? "Video" : "Audio"}`,
    message: "Getting data...",
    style: Toast.Style.Animated,
  });

  toast.show();

  const ytdlp = new YTDlpWrap(preferences.ytdlpBinaryPath);

  const fileExtension = options.ext ? (options.ext.startsWith(".") ? options.ext : `.${options.ext}`) : ".%(ext)s";

  const filePath = `${preferences.downloadPath}/%(title).150B${fileExtension}`;

  const args = [url, "-f", formatObject.itag, "-o", filePath];

  if (options.startTime || options.endTime) {
    args.push(
      `--postprocessor-args "-ss ${options.startTime || "00:00:00"}${options.endTime ? ` -to ${options.endTime}` : ""}"`,
    );
  }

  var controller = new AbortController();
  var signal = controller.signal;

  toast.primaryAction = {
    title: "Cancel",
    onAction: () => {
      controller.abort();
      toast.hide();
    },
  };
  
  ytdlp
    .exec(args, {signal})
    .on("progress", (progress) => {
      if(!progress.percent || isNaN(progress.percent))
        return;

      toast.message = `${Math.round(progress.percent)}%`;
    })
    .on("ytDlpEvent", (eventType, eventData) => {
      console.log(eventType, eventData)

      switch (eventType) {
        case "info":
          toast.message = "Starting download...";
          break;
      }
    })
    .on("error", (error) => {
      console.log(error);

      toast.title = "Download Failed";
      toast.style = Toast.Style.Failure;
      toast.message = "Please try again later.";
      resolve(error);
    })
    .on("close", () => {
      toast.title = "Download Complete";
      toast.message = url;
      toast.style = Toast.Style.Success;
      showHUD(toast.title);
      
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

      resolve(toast.title);
    });
  })
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

  const [hours, minutes, seconds = "0"] = parts.map((part) => parseInt(part));

  if (isNaN(hours) || isNaN(minutes) || isNaN(+seconds)) {
    throw new Error("Invalid input");
  }

  return (hours || 0) * 60 * 60 + minutes * 60 + +seconds;
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
