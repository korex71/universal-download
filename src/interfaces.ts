export type DownloadOptions = {
  url: string;
  format: string;
  copyToClipboard: boolean;
  startTime?: string;
  endTime?: string;
  ext?: string;
};

export type FormatOptions = {
  itag: string;
  container: string;
  type: "S" | "V";
};

export interface VideoInfo {
  id: string;
  extractor_key: string;
  extractor: string;
  webpage_url: string;
  title: string;
  description: string;
  timestamp: number;
  view_count: number;
  like_count: number;
  repost_count: number;
  comment_count: number;
  uploader: string;
  uploader_id: string;
  creator: string;
  channel_id: string;
  uploader_url: string;
  track: string;
  album: string;
  artist: string;
  formats: Format[];
  subtitles: Subtitles;
  thumbnails: Thumbnail[];
  duration: number;
  availability: string;
  _format_sort_fields: string[];
  original_url: string;
  webpage_url_basename: string;
  webpage_url_domain: string;
  playlist: string;
  playlist_index: string;
  thumbnail: string;
  display_id: string;
  fulltitle: string;
  duration_string: string;
  upload_date: string;
  release_year: string;
  requested_subtitles: string;
  _has_drm: string;
  epoch: number;
  url: string;
  filesize: number;
  ext: string;
  acodec: string;
  source_preference: number;
  format_id: string;
  format_note: string;
  tbr: number;
  vcodec: string;
  fps: string;
  height: number;
  quality: number;
  width: number;
  protocol: string;
  resolution: string;
  dynamic_range: string;
  aspect_ratio: number;
  http_headers: HttpHeaders2;
  video_ext: string;
  audio_ext: string;
  vbr: string;
  abr: string;
  format: string;
  _filename: string;
  filename: string;
  _type: string;
  _version: Version;
}

export interface Format {
  url: string;
  filesize: number;
  ext: string;
  acodec: string;
  source_preference: number;
  format_id: string;
  format_note: string;
  vcodec: string;
  width: number;
  height: number;
  preference?: number;
  protocol: string;
  resolution: string;
  dynamic_range: string;
  aspect_ratio: number;
  cookies?: string;
  http_headers: HttpHeaders;
  video_ext: string;
  audio_ext: string;
  vbr: string;
  abr: string;
  tbr?: number;
  format: string;
  quality?: number;
  fps: string;
}

export interface HttpHeaders {
  "User-Agent": string;
  Accept: string;
  "Accept-Language": string;
  "Sec-Fetch-Mode": string;
}

export interface Subtitles {}

export interface Thumbnail {
  id: string;
  url: string;
}

export interface HttpHeaders2 {
  "User-Agent": string;
  Accept: string;
  "Accept-Language": string;
  "Sec-Fetch-Mode": string;
}

export interface Version {
  version: string;
  current_git_head: string;
  release_git_head: string;
  repository: string;
}
