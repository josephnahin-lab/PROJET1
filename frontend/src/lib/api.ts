import type { Validator } from "@/lib/guards";
import type { PageMeta } from "@/lib/types";

export type ApiFailure = {
  message: string;
  status?: number;
};

export type ApiResult<T> =
  | {
      ok: true;
      data: T;
      meta?: PageMeta;
    }
  | { ok: false; failure: ApiFailure };

export type PaginatedApiResult<T> =
  | { ok: true; data: T; meta: PageMeta }
  | { ok: false; failure: ApiFailure };

type ApiBaseResolution =
  | { ok: true; baseUrl: string }
  | { ok: false; failure: ApiFailure };

function resolveApiBaseUrl(): ApiBaseResolution {
  const configured = process.env.API_BASE_URL?.trim();
  if (!configured) {
    return {
      ok: false,
      failure: {
        message:
          "Configuration API manquante : définissez API_BASE_URL côté serveur avec une URL absolue http:// ou https://.",
      },
    };
  }

  try {
    const url = new URL(configured);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      !url.hostname ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      return {
        ok: false,
        failure: {
          message:
            "Configuration API invalide : API_BASE_URL doit être une URL absolue http:// ou https:// sans identifiants, paramètres ni fragment.",
        },
      };
    }
    return { ok: true, baseUrl: `${url.toString().replace(/\/+$/, "")}/` };
  } catch {
    return {
      ok: false,
      failure: {
        message:
          "Configuration API invalide : API_BASE_URL doit être une URL absolue http:// ou https://.",
      },
    };
  }
}

function isPageMeta(value: unknown): value is PageMeta {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const meta = value as Record<string, unknown>;
  return (
    typeof meta.limit === "number" &&
    Number.isInteger(meta.limit) &&
    meta.limit >= 1 &&
    meta.limit <= 100 &&
    typeof meta.hasMore === "boolean" &&
    (meta.nextCursor === undefined ||
      meta.nextCursor === null ||
      (typeof meta.nextCursor === "string" && meta.nextCursor.length <= 512)) &&
    (!meta.hasMore ||
      (typeof meta.nextCursor === "string" &&
        meta.nextCursor.trim().length > 0))
  );
}

function invalidResponse(message: string, status?: number): ApiResult<never> {
  return { ok: false, failure: { message, status } };
}

async function apiGetInternal<T>(
  path: string,
  searchParams: URLSearchParams | undefined,
  validateData: Validator<T>,
  requireMeta: boolean,
): Promise<ApiResult<T>> {
  const base = resolveApiBaseUrl();
  if (!base.ok) return { ok: false, failure: base.failure };

  const url = new URL(path.replace(/^\/+/, ""), base.baseUrl);
  if (searchParams) {
    searchParams.forEach((value, key) => url.searchParams.append(key, value));
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return {
      ok: false,
      failure: {
        message:
          "L’API Librescence est indisponible ou injoignable depuis le serveur Next.js.",
      },
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      failure: {
        message:
          response.status === 404
            ? "Le contenu demandé n’existe pas ou n’est pas publié."
            : "L’API n’a pas pu fournir ce contenu.",
        status: response.status,
      },
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      failure: {
        message: "L’API a renvoyé une réponse JSON illisible.",
        status: response.status,
      },
    };
  }

  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return invalidResponse(
      "Réponse API invalide : l’enveloppe doit être un objet.",
      response.status,
    );
  }

  const envelope = payload as Record<string, unknown>;
  if (!("data" in envelope) || !validateData(envelope.data)) {
    return invalidResponse(
      "Réponse API invalide : le champ data ne respecte pas le schéma attendu par le contrat.",
      response.status,
    );
  }

  if (requireMeta && !("meta" in envelope)) {
    return invalidResponse(
      "Réponse API invalide : les métadonnées de pagination sont obligatoires pour cet endpoint.",
      response.status,
    );
  }

  let meta: PageMeta | undefined;
  if ("meta" in envelope) {
    if (!isPageMeta(envelope.meta)) {
      return invalidResponse(
        "Réponse API invalide : les métadonnées de pagination ne respectent pas le contrat.",
        response.status,
      );
    }
    meta = envelope.meta;
    if (
      requireMeta &&
      meta.hasMore &&
      (typeof meta.nextCursor !== "string" ||
        meta.nextCursor.trim().length === 0)
    ) {
      return invalidResponse(
        "Réponse API invalide : hasMore vaut true mais nextCursor est absent ou vide.",
        response.status,
      );
    }
  }

  return { ok: true, data: envelope.data, ...(meta ? { meta } : {}) };
}

export function apiGet<T>(
  path: string,
  searchParams: URLSearchParams | undefined,
  validateData: Validator<T>,
): Promise<ApiResult<T>> {
  return apiGetInternal(path, searchParams, validateData, false);
}

export async function apiGetPaginated<T>(
  path: string,
  searchParams: URLSearchParams | undefined,
  validateData: Validator<T>,
): Promise<PaginatedApiResult<T>> {
  const result = await apiGetInternal(path, searchParams, validateData, true);
  if (!result.ok) return result;
  if (!result.meta) {
    return {
      ok: false,
      failure: {
        message:
          "Réponse API invalide : les métadonnées de pagination sont obligatoires pour cet endpoint.",
      },
    };
  }
  return { ok: true, data: result.data, meta: result.meta };
}
