export interface VideoIdea {
  title: string;
  description: string;
  viralScore: number;
}

export interface Script {
  hook: string;
  intro: string;
  mainContent: string;
  outro: string;
}

export interface ShortFormIdea {
  title: string;
  concept: string;
  hook: string;
  viralScore: number;
}

export interface YouTubeContent {
  videoIdeas: VideoIdea[];
  script: Script;
  titles: string[];
  thumbnailIdeas: string[];
  seoDescription: string;
}

export interface InstagramContent {
  caption: string;
  hashtags: string[];
}

export interface ShortsContent {
  shortFormIdeas: ShortFormIdea[];
}

export interface GeneratedContent {
  youtube?: YouTubeContent;
  instagram?: InstagramContent;
  shorts?: ShortsContent;
}
