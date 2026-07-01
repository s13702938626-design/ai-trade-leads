export type SerperSearchCandidate = {
  id: string;
  title: string;
  link: string;
  snippet: string;
  domain: string;
  position: number;
  sourceType: "serper_google_search";
  fetchedAt: string;
};
