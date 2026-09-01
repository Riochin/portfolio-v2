export type OutputSource = "speakerdeck" | "zenn" | "qiita";

export type OutputItem = {
  source: OutputSource;
  title: string;
  url: string;
  publishedAt: string;
};
