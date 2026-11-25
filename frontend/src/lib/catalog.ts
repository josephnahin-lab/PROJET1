import { apiGet, apiGetPaginated } from "@/lib/api";
import type {
  Domain,
  DomainDetail,
  Pathway,
  PublicQuiz,
  SearchResult,
} from "@/lib/types";
import {
  isDomainDetail,
  isDomainList,
  isPathway,
  isPublicQuiz,
  isSearchResultList,
} from "@/lib/guards";

export async function getDomains(params?: {
  query?: string;
  family?: string;
  cursor?: string;
}) {
  const search = new URLSearchParams({ limit: "100" });
  if (params?.query) search.set("q", params.query);
  if (params?.family) search.set("family", params.family);
  if (params?.cursor) search.set("cursor", params.cursor);
  return apiGetPaginated<Domain[]>("domains", search, isDomainList);
}

export async function getDomain(domainId: string) {
  return apiGet<DomainDetail>(
    `domains/${encodeURIComponent(domainId)}`,
    undefined,
    isDomainDetail,
  );
}

export async function getPathway(pathwayId: string) {
  return apiGet<Pathway>(
    `pathways/${encodeURIComponent(pathwayId)}`,
    undefined,
    isPathway,
  );
}

export async function searchCatalog(
  query: string,
  family?: string,
  cursor?: string,
) {
  const search = new URLSearchParams({ q: query, limit: "100" });
  if (family) search.set("family", family);
  if (cursor) search.set("cursor", cursor);
  return apiGetPaginated<SearchResult[]>("search", search, isSearchResultList);
}

export async function getPublicQuiz(quizId: string) {
  return apiGet<PublicQuiz>(
    `quizzes/${encodeURIComponent(quizId)}`,
    undefined,
    isPublicQuiz,
  );
}

