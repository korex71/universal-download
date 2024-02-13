import { Action, ActionPanel, Clipboard, Detail, Form, Icon, showToast, Toast } from "@raycast/api";
import { FormValidation, useForm } from "@raycast/utils";
import { execSync } from "child_process";
import fs from "fs";
import prettyBytes from "pretty-bytes";
import { useEffect, useMemo, useState } from "react";
import YTDlpWrap from "yt-dlp-wrap";
import { DownloadOptions, FormatOptions, VideoInfo } from "./interfaces";
import { download, formatHHMM, isValidHHMM, isValidUrl, parseHHMM, preferences } from "./utils";

export default function Command() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(0);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);

  const duration = videoInfo?.duration || 0;
  const title = videoInfo?.title || "";
  const formats = videoInfo?.formats || [];

  const { handleSubmit, values, itemProps, setValue, setValidationError } = useForm<DownloadOptions>({
    onSubmit: async (values) => {
      setLoading(true);

      await download(values.url, values);

      setLoading(false);
    },
    validation: {
      url: (value) => {
        console.log(value);
        if (!value) {
          return "URL is required";
        }
      },
      format: FormValidation.Required,
      startTime: (value) => {
        if (value) {
          if (!isValidHHMM(value)) {
            return "Invalid time format";
          }
        }
      },
      endTime: (value) => {
        if (value) {
          if (!isValidHHMM(value)) {
            return "Invalid time format";
          }
          if (parseHHMM(value) > duration) {
            return "End time is greater than video duration";
          }
        }
      },
    },
  });

  useEffect(() => {
    if (values.url && isValidUrl(values.url)) {
      setLoading(true);

      const ytDlpWrap = new YTDlpWrap(preferences.ytdlpBinaryPath);

      ytDlpWrap
        .getVideoInfo(values.url)
        .then((res) => {
          setVideoInfo(res);
        })
        .catch((err) => {
          console.error(err);
          setValidationError("url", "Video not found");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [values.url]);

  useEffect(() => {
    Clipboard.readText().then((text) => {
      if (text && isValidUrl(text)) {
        setValue("url", text);
      }
    });
  }, []);

  const missingExecutable = useMemo(() => {
    if (!fs.existsSync(preferences.ytdlpBinaryPath)) {
      return "yt-dlp";
    }
    return null;
  }, [error]);

  if (missingExecutable) {
    return <NotInstalled executable={missingExecutable} onRefresh={() => setError(error + 1)} />;
  }

  const videoFormats = formats.filter((format) => !format.resolution.includes("audio")) || [];

  const audioFormats = formats.filter((format) => format.resolution.includes("audio"));

  const currentFormat = JSON.parse(values.format || "{}");
  const isSelectedAudio = currentFormat.type === "S";

  function NotInstalled({ executable, onRefresh }: { executable: string; onRefresh: () => void }) {
    return (
      <Detail
        actions={<AutoInstall onRefresh={onRefresh} />}
        markdown={`
  # 🚨 Error: \`${executable}\` is not installed
  This extension depends on a command-line utilty that is not detected on your system. You must install it continue.

  If you have homebrew installed, simply press **⏎** to have this extension install it for you. Since \`${executable}\` is a heavy library, 
  **it can take up 2 minutes to install**.

  To install homebrew, visit [this link](https://brew.sh)
    `}
      />
    );
  }
  function AutoInstall({ onRefresh }: { onRefresh: () => void }) {
    const [isLoading, setIsLoading] = useState(false);
    return (
      <ActionPanel>
        {!isLoading && (
          <Action
            title="Install with Homebrew"
            icon={Icon.Download}
            onAction={async () => {
              if (isLoading) return;

              setIsLoading(true);

              const toast = await showToast({ style: Toast.Style.Animated, title: "Installing yt-dlp..." });
              await toast.show();

              try {
                execSync(`zsh -l -c 'brew install yt-dlp'`);
                await toast.hide();
                onRefresh();
              } catch (e) {
                await toast.hide();
                console.error(e);
                await showToast({
                  style: Toast.Style.Failure,
                  title: "Error installing",
                  message: "An unknown error occured while trying to install",
                });
              }
              setIsLoading(false);
            }}
          />
        )}
      </ActionPanel>
    );
  }

  return (
    <Form
      isLoading={loading}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            icon={Icon.Download}
            title={isSelectedAudio ? "Download Audio" : "Download Video"}
            onSubmit={(values) => {
              handleSubmit({ ...values, copyToClipboard: false } as DownloadOptions);
            }}
          />
          <Action.SubmitForm
            icon={Icon.CopyClipboard}
            title={`Copy ${isSelectedAudio ? "Audio" : "Video"}`}
            onSubmit={(values) => {
              handleSubmit({ ...values, copyToClipboard: true } as DownloadOptions);
            }}
          />
        </ActionPanel>
      }
    >
      <Form.Description title="Title" text={title || "No video selected"} />
      <Form.TextField
        autoFocus
        title="URL"
        placeholder="https://www.youtube.com/watch?v=2yJgwwDcgV8"
        {...itemProps.url}
      />
      <Form.Dropdown title="Format" {...itemProps.format}>
        {["mp4", "webm"].map((container) => (
          <Form.Dropdown.Section key={container} title={`Video (${container})`}>
            {videoFormats
              .filter((format) => format.ext == container)
              .map((format) => (
                <Form.Dropdown.Item
                  key={format.format_id}
                  value={JSON.stringify({
                    itag: format.format_id.toString(),
                    container: container,
                    type: "V",
                  } as FormatOptions)}
                  title={`${format.resolution}${
                    format.filesize ? ` (${prettyBytes(format.filesize)})` : ""
                  } [${container}] ${format.format_note ? `[${format.format_note}]` : ""}`}
                  icon={Icon.Video}
                />
              ))}
          </Form.Dropdown.Section>
        ))}
        <Form.Dropdown.Section title="Audio">
          {audioFormats.map((format, index) => (
            <Form.Dropdown.Item
              key={index}
              value={JSON.stringify({ itag: String(format.format_id), type: "S" } as FormatOptions)}
              title={`${format.abr ? format.abr + "kps " : format.format}${format.filesize ? `(${prettyBytes(format.filesize)}) ` : " "}`}
              icon={Icon.Music}
            />
          ))}
        </Form.Dropdown.Section>
      </Form.Dropdown>
      <Form.Separator />

      <Form.TextField
        info="Optional field. Save as '.mp4' or '.mp3'"
        title="Custom extension"
        placeholder=".mp4"
        {...itemProps.ext}
      />

      <Form.TextField
        info="Optional field. Follow the format HH:MM:SS or MM:SS."
        title="Start Time"
        placeholder="00:00"
        {...itemProps.startTime}
      />
      <Form.TextField
        info="Optional field. Follow the format HH:MM:SS or MM:SS."
        title="End Time"
        placeholder={duration ? formatHHMM(duration) : "00:00"}
        {...itemProps.endTime}
      />
    </Form>
  );
}
