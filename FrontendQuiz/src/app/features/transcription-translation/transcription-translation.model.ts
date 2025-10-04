export interface stream_transcript {
  filename: string,
  stream_title: string,
  vtuber: string,
  transcripts: transcript_row[];
}

export interface transcript_row {
  index: number;
  transcript: string;
  from: string;
  to: string;
  reading: string;
  meaning: string;
  notes: string;
}

export interface transcript_information {
  filename: string,
  stream_title: string,
  vtuber: string,
}

export const EXAMPLE_STREAM_TRANSCRIPT: stream_transcript = {
  filename: "example_filename.txt",
  stream_title: "example_stream_title",
  vtuber: "example_vtuber",
  transcripts: [{
    "index": 1,
    "transcript": "メロンさんモノクローンさんこんばんは",
    "from": "00:02:13,400",
    "to": "00:02:18,800",
    "reading": "",
    "meaning": "",
    "notes": ""
  },
    {
      "index": 2,
      "transcript": "フォローナイト",
      "from": "00:02:18,919",
      "to": "00:02:22,098",
      "reading": "",
      "meaning": "",
      "notes": ""
    }]

}
