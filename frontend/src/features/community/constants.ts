import type { PostFormat, Topic } from "../types";

export const topicNames: Record<Topic, string> = {
  soundtrack: "Soundtrack",
  anime: "Anime",
  gaming: "Gaming",
  movies: "Movies",
  tv: "TV Shows",
  kpop: "K-pop",
  comic: "Comic",
  manga: "Manga",
  cosplay: "Cosplay",
};

export const topicOptions = Object.entries(topicNames) as [Topic, string][];

export const formatNames: Record<PostFormat, string> = {
  post: "Post",
  video: "Video",
  soundtrack: "Soundtrack",
};

export const topicImages: Record<Topic, string> = {
  soundtrack: "/art/kpop.svg",
  anime: "/art/anime.svg",
  gaming: "/art/gaming.svg",
  movies: "/art/movies.svg",
  tv: "/art/tv.svg",
  kpop: "/art/kpop.svg",
  comic: "/art/comics.svg",
  manga: "/art/manga.svg",
  cosplay: "/art/cosplay.svg",
};
