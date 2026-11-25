import type { Validator } from "@/lib/guards";
import { isRecord, isSafePublicHttpsUrl } from "@/lib/guards";

export type AccountFailure = {
  message: string;
  status?: number;
  fields?: Record<string, string[]>;
};

export type AccountResult<T> =
  | { ok: true; data: T }
  | { ok: false; failure: AccountFailure };

export type CurrentUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  status?: "active" | "deletion_pending";
};

export type AuthSession = {
  user: CurrentUser;
  csrfRequired: boolean;
};

export type Profile = {
  displayName: string | null;
  avatar?: Record<string, unknown>;
  interests: string[];
  theme: "light" | "dark";
  resourceLanguage: "fr" | "en" | "es";
  learningMode: "guided" | "free";
  locale: string;
};

export type LearnerProgress = {
  pathways: Array<{
    pathwayId: string;
    status: "not_started" | "in_progress" | "completed" | "archived";
    plan: "two_weeks" | "four_weeks" | "eight_weeks" | "flex";
    completedLessonIds: string[];
    startedAt?: string | null;
    completedAt?: string | null;
  }>;
  lessonProgress: Array<{
    lessonId: string;
    status: "in_progress" | "completed";
    completedAt?: string | null;
    updatedAt: string;
  }>;
  projectProgress: Array<{
    projectId: string;
    status: "not_started" | "in_progress" | "completed";
    checkedItemIds: string[];
    url?: string | null;
    completedAt?: string | null;
    updatedAt: string;
  }>;
  weeklyGoal: WeeklyGoal;
  activeDays: string[];
};

export type WeeklyGoal = {
  targetDays: 2 | 3 | 5 | 7;
  updatedAt: string;
};

export type LessonProgress = {
  lessonId: string;
  status: "in_progress" | "completed";
  completedAt?: string | null;
  updatedAt: string;
};

export type LearnerNote = {
  id: string;
  lessonId: string;
  body: string;
  updatedAt: string;
};

export type SavedResource = {
  id: string;
  url: string;
  title: string;
  source?: string | null;
  resourceId?: string | null;
  createdAt: string;
};

export type ProjectProgress = {
  projectId: string;
  status: "not_started" | "in_progress" | "completed";
  checkedItemIds: string[];
  url?: string | null;
  completedAt?: string | null;
  updatedAt: string;
};

export type PortfolioAttachment = {
  id: string;
  name: string;
  mediaType: "application/pdf" | "image/jpeg" | "image/png" | "image/webp";
  sizeBytes: number;
  createdAt: string;
};

export type PortfolioItem = {
  id: string;
  title: string;
  description: string;
  domainId: string | null;
  projectDate: string | null;
  skills: string | null;
  difficulties: string | null;
  learnings: string | null;
  url: string | null;
  visibility: "private";
  createdAt: string;
  updatedAt: string;
  attachments: PortfolioAttachment[];
};

export type PageMeta = {
  limit: number;
  hasMore: boolean;
  nextCursor?: string | null;
};

function resolveBrowserApiBase(): URL | null {
  if (typeof window === "undefined") return null;
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!configured) return null;

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
      return null;
    }
    return new URL(`${url.toString().replace(/\/+$/, "")}/`);
  } catch {
    return null;
  }
}

function configFailure(): AccountFailure {
  return {
    message:
      "Configuration API manquante ou invalide : NEXT_PUBLIC_API_BASE_URL doit être une URL absolue http:// ou https://, sans identifiants, paramètres ni fragment.",
  };
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isUuid(value: unknown): value is string {
  return (
    isString(value) &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function isDateTime(value: unknown): value is string {
  if (!isString(value)) return false;
  const match = value.match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-](\d{2}):(\d{2}))$/,
  );
  if (
    !match ||
    !isCalendarDate(match[1]) ||
    Number(match[2]) > 23 ||
    Number(match[3]) > 59 ||
    Number(match[4]) > 59 ||
    (match[6] !== undefined &&
      (Number(match[6]) > 23 || Number(match[7]) > 59))
  ) {
    return false;
  }
  return !Number.isNaN(Date.parse(value));
}

function isCalendarDate(value: unknown): value is string {
  if (!isString(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
}

function isStringArray(value: unknown, maxLength: number): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => isString(item) && item.length <= maxLength)
  );
}

export const isAuthSession: Validator<AuthSession> = (
  value,
): value is AuthSession =>
  isRecord(value) &&
  hasOnlyKeys(value, ["user", "csrfRequired"]) &&
  isRecord(value.user) &&
  isUuid(value.user.id) &&
  isString(value.user.email) &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.user.email) &&
  typeof value.user.emailVerified === "boolean" &&
  (value.user.status === undefined ||
    value.user.status === "active" ||
    value.user.status === "deletion_pending") &&
  typeof value.csrfRequired === "boolean";

function hasOnlyKeys(value: Record<string, unknown>, keys: string[]) {
  return Object.keys(value).every((key) => keys.includes(key));
}

export const isProfile: Validator<Profile> = (
  value,
): value is Profile =>
  isRecord(value) &&
  isNullableString(value.displayName) &&
  (value.displayName === null || value.displayName.length <= 60) &&
  (value.avatar === undefined || isRecord(value.avatar)) &&
  Array.isArray(value.interests) &&
  value.interests.length <= 8 &&
  isStringArray(value.interests, 80) &&
  new Set(value.interests).size === value.interests.length &&
  (value.theme === "light" || value.theme === "dark") &&
  ["fr", "en", "es"].includes(String(value.resourceLanguage)) &&
  (value.learningMode === "guided" || value.learningMode === "free") &&
  isString(value.locale) &&
  value.locale.length <= 16;

export const isWeeklyGoal: Validator<WeeklyGoal> = (
  value,
): value is WeeklyGoal =>
  isRecord(value) &&
  hasOnlyKeys(value, ["targetDays", "updatedAt"]) &&
  typeof value.targetDays === "number" &&
  [2, 3, 5, 7].includes(Number(value.targetDays)) &&
  Number.isInteger(value.targetDays) &&
  isDateTime(value.updatedAt);

function isProgressEntry(value: unknown): boolean {
  return (
    isRecord(value) &&
    isUuid(value.pathwayId) &&
    ["not_started", "in_progress", "completed", "archived"].includes(
      String(value.status),
    ) &&
    ["two_weeks", "four_weeks", "eight_weeks", "flex"].includes(
      String(value.plan),
    ) &&
    Array.isArray(value.completedLessonIds) &&
    value.completedLessonIds.every(isUuid) &&
    new Set(value.completedLessonIds).size === value.completedLessonIds.length &&
    (value.startedAt === undefined ||
      value.startedAt === null ||
      isDateTime(value.startedAt)) &&
    (value.completedAt === undefined ||
      value.completedAt === null ||
      isDateTime(value.completedAt))
  );
}

export const isLessonProgress: Validator<LessonProgress> = (
  value,
): value is LessonProgress => {
  return (
    isRecord(value) &&
    isUuid(value.lessonId) &&
    ["in_progress", "completed"].includes(String(value.status)) &&
    isDateTime(value.updatedAt) &&
    (value.completedAt === undefined ||
      value.completedAt === null ||
      isDateTime(value.completedAt))
  );
};

export function isProjectProgress(value: unknown): value is ProjectProgress {
  return (
    isRecord(value) &&
    isUuid(value.projectId) &&
    ["not_started", "in_progress", "completed"].includes(String(value.status)) &&
    Array.isArray(value.checkedItemIds) &&
    value.checkedItemIds.length <= 50 &&
    value.checkedItemIds.every(
      (item) => isString(item) && item.length <= 120,
    ) &&
    new Set(value.checkedItemIds).size === value.checkedItemIds.length &&
    isDateTime(value.updatedAt) &&
    (value.url === undefined ||
      value.url === null ||
      isSafePublicHttpsUrl(value.url, 500)) &&
    (value.completedAt === undefined ||
      value.completedAt === null ||
      isDateTime(value.completedAt))
  );
}

export function isProjectProgressData(value: unknown): value is ProjectProgress {
  return isProjectProgress(value);
}

export function isPortfolioAttachment(value: unknown): value is PortfolioAttachment {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["id", "name", "mediaType", "sizeBytes", "createdAt"]) ||
    !isUuid(value.id) ||
    !isString(value.name) ||
    value.name.length > 160 ||
    !isDateTime(value.createdAt) ||
    typeof value.sizeBytes !== "number" ||
    !Number.isInteger(value.sizeBytes) ||
    value.sizeBytes < 1
  ) {
    return false;
  }

  if (value.mediaType === "application/pdf") {
    return value.sizeBytes <= 5_242_880;
  }
  return (
    ["image/jpeg", "image/png", "image/webp"].includes(String(value.mediaType)) &&
    value.sizeBytes <= 2_097_152
  );
}

export function isPortfolioItem(value: unknown): value is PortfolioItem {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, [
      "id",
      "title",
      "description",
      "domainId",
      "projectDate",
      "skills",
      "difficulties",
      "learnings",
      "url",
      "visibility",
      "createdAt",
      "updatedAt",
      "attachments",
    ]) &&
    isUuid(value.id) &&
    isString(value.title) &&
    value.title.length >= 1 &&
    value.title.length <= 100 &&
    isString(value.description) &&
    value.description.length >= 1 &&
    value.description.length <= 3000 &&
    (value.domainId === null ||
      (isString(value.domainId) && value.domainId.length <= 100)) &&
    (value.projectDate === null || isCalendarDate(value.projectDate)) &&
    (value.skills === null || (isString(value.skills) && value.skills.length <= 500)) &&
    (value.difficulties === null ||
      (isString(value.difficulties) && value.difficulties.length <= 1500)) &&
    (value.learnings === null ||
      (isString(value.learnings) && value.learnings.length <= 1500)) &&
    (value.url === null ||
      (isString(value.url) && value.url.length <= 500 && isSafePublicHttpsUrl(value.url, 500))) &&
    value.visibility === "private" &&
    isDateTime(value.createdAt) &&
    isDateTime(value.updatedAt) &&
    Array.isArray(value.attachments) &&
    value.attachments.length <= 2 &&
    value.attachments.every(isPortfolioAttachment)
  );
}

export function isPortfolioItemList(value: unknown): value is PortfolioItem[] {
  return Array.isArray(value) && value.every(isPortfolioItem);
}

export const isLearnerProgress: Validator<LearnerProgress> = (
  value,
): value is LearnerProgress =>
  isRecord(value) &&
  Array.isArray(value.pathways) &&
  value.pathways.every(isProgressEntry) &&
  Array.isArray(value.lessonProgress) &&
  value.lessonProgress.every(isLessonProgress) &&
  Array.isArray(value.projectProgress) &&
  value.projectProgress.every(isProjectProgress) &&
  isWeeklyGoal(value.weeklyGoal) &&
  Array.isArray(value.activeDays) &&
  value.activeDays.length <= 400 &&
  value.activeDays.every(isCalendarDate);

export const isLearnerNote: Validator<LearnerNote> = (
  value,
): value is LearnerNote =>
  isRecord(value) &&
  isUuid(value.id) &&
  isUuid(value.lessonId) &&
  isString(value.body) &&
  value.body.length <= 10000 &&
  isDateTime(value.updatedAt);

export const isSavedResource: Validator<SavedResource> = (
  value,
): value is SavedResource =>
  isRecord(value) &&
  isUuid(value.id) &&
  isString(value.url) &&
  value.url.length <= 1000 &&
  isSafePublicHttpsUrl(value.url) &&
  isString(value.title) &&
  value.title.length <= 180 &&
  isDateTime(value.createdAt) &&
  (value.source === undefined ||
    value.source === null ||
    (isString(value.source) && value.source.length <= 100)) &&
  (value.resourceId === undefined ||
    value.resourceId === null ||
    isUuid(value.resourceId));

export const isNoteList: Validator<LearnerNote[]> = (
  value,
): value is LearnerNote[] => Array.isArray(value) && value.every(isLearnerNote);

export const isSavedResourceList: Validator<SavedResource[]> = (
  value,
): value is SavedResource[] =>
  Array.isArray(value) && value.every(isSavedResource);

function isPageMeta(value: unknown): value is PageMeta {
  return (
    isRecord(value) &&
    typeof value.limit === "number" &&
    Number.isInteger(value.limit) &&
    value.limit >= 1 &&
    value.limit <= 100 &&
    typeof value.hasMore === "boolean" &&
    (value.nextCursor === undefined ||
      value.nextCursor === null ||
      (isString(value.nextCursor) && value.nextCursor.length <= 512)) &&
    (!value.hasMore ||
      (isString(value.nextCursor) && value.nextCursor.trim().length > 0))
  );
}

function apiUrl(path: string): URL | null {
  const base = resolveBrowserApiBase();
  if (!base) return null;
  return new URL(path.replace(/^\/+/, ""), base);
}

function getXsrfToken(): string | null {
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("XSRF-TOKEN="));
  if (!cookie) return null;

  try {
    return decodeURIComponent(cookie.slice("XSRF-TOKEN=".length));
  } catch {
    return null;
  }
}

export async function bootstrapCsrf(): Promise<AccountFailure | null> {
  const url = apiUrl("auth/csrf-cookie");
  if (!url) return configFailure();

  try {
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      redirect: "manual",
      headers: { Accept: "application/json, application/problem+json" },
    });
    if (response.status !== 204) {
      return await readFailure(response);
    }
    if (!getXsrfToken()) {
      return {
        message:
          "Le serveur n’a pas fourni le cookie CSRF attendu. Aucune modification n’a été envoyée.",
        status: response.status,
      };
    }
    return null;
  } catch {
    return {
      message:
        "Impossible de joindre l’API Librescence pour initialiser la protection CSRF.",
    };
  }
}

async function readFailure(response: Response): Promise<AccountFailure> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return {
      message: `L’API a renvoyé une réponse illisible (HTTP ${response.status}).`,
      status: response.status,
    };
  }

  if (!isRecord(payload) || !isProblemPayload(payload, response.status)) {
    return {
      message: `Réponse d’erreur API invalide ou non conforme au contrat (HTTP ${response.status}).`,
      status: response.status,
    };
  }

  const fields: Record<string, string[]> = {};
  if (isRecord(payload.errors)) {
    for (const [key, messages] of Object.entries(payload.errors)) {
      if (Array.isArray(messages)) {
        fields[key] = messages.filter(isString);
      }
    }
  }

  const detail = isString(payload.detail) ? payload.detail : undefined;
  const title = isString(payload.title) ? payload.title : undefined;
  return {
    message:
      detail ||
      title ||
      `La requête a échoué (HTTP ${response.status}). Vérifiez les informations et réessayez.`,
    status: response.status,
    ...(Object.keys(fields).length > 0 ? { fields } : {}),
  };
}

function isProblemPayload(
  payload: Record<string, unknown>,
  httpStatus: number,
): boolean {
  const allowed = [
    "type",
    "title",
    "status",
    "detail",
    "instance",
    "traceId",
    "code",
    "errors",
    "feature",
  ];
  if (
    !hasOnlyKeys(payload, allowed) ||
    !isString(payload.type) ||
    !isString(payload.title) ||
    typeof payload.status !== "number" ||
    !Number.isInteger(payload.status) ||
    payload.status < 400 ||
    payload.status > 599 ||
    payload.status !== httpStatus ||
    !isString(payload.traceId) ||
    payload.traceId.length > 80 ||
    (payload.code !== undefined &&
      (!isString(payload.code) || payload.code.length > 80)) ||
    (payload.detail !== undefined && !isString(payload.detail)) ||
    (payload.instance !== undefined && !isString(payload.instance))
  ) {
    return false;
  }

  if (payload.errors !== undefined) {
    if (!isRecord(payload.errors)) return false;
    if (
      !Object.values(payload.errors).every(
        (messages) => Array.isArray(messages) && messages.every(isString),
      )
    ) {
      return false;
    }
  }

  if (payload.code === "FEATURE_DISABLED") {
    return (
      httpStatus === 503 &&
      [
        "guest_quiz_session",
        "quiz_attempt_persistence",
        "quiz_attempt_history",
        "imported_quiz_results",
        "contact_storage",
      ].includes(String(payload.feature))
    );
  }
  return payload.feature === undefined;
}

async function parseResponse<T>(
  response: Response,
  validateData: Validator<T>,
): Promise<AccountResult<T>> {
  if (!response.ok) {
    return { ok: false, failure: await readFailure(response) };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      failure: {
        message: "Réponse API invalide : le contenu JSON est illisible.",
        status: response.status,
      },
    };
  }

  if (!isRecord(payload) || !("data" in payload) || !validateData(payload.data)) {
    return {
      ok: false,
      failure: {
        message:
          "Réponse API invalide : les données reçues ne respectent pas le contrat attendu.",
        status: response.status,
      },
    };
  }
  return { ok: true, data: payload.data };
}

export async function accountRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    body?: unknown;
    validateData?: Validator<T>;
    noContent?: boolean;
    extraHeaders?: Record<string, string>;
  } = {},
): Promise<AccountResult<T | null>> {
  const method = options.method ?? "GET";
  const url = apiUrl(path);
  if (!url) return { ok: false, failure: configFailure() };

  const headers = new Headers({
    Accept: "application/json, application/problem+json",
  });
  for (const [name, value] of Object.entries(options.extraHeaders ?? {})) {
    headers.set(name, value);
  }
  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    if (typeof FormData !== "undefined" && options.body instanceof FormData) {
      body = options.body;
    } else {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.body);
    }
  }

  if (method !== "GET") {
    const csrfFailure = await bootstrapCsrf();
    if (csrfFailure) return { ok: false, failure: csrfFailure };
    const token = getXsrfToken();
    if (!token) {
      return {
        ok: false,
        failure: {
          message:
            "Le cookie CSRF a disparu avant l’envoi. Aucune modification n’a été envoyée.",
        },
      };
    }
    headers.set("X-XSRF-TOKEN", token);
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
      credentials: "include",
      cache: "no-store",
      redirect: "manual",
    });
    if (response.status === 401) {
      return {
        ok: false,
        failure: {
          message: "Votre session n’est pas ouverte ou a expiré. Connectez-vous pour continuer.",
          status: 401,
        },
      };
    }
    if (options.noContent) {
      if (response.status === 204) {
        return { ok: true, data: null };
      }
      if (!response.ok) {
        return { ok: false, failure: await readFailure(response) };
      }
      return {
        ok: false,
        failure: {
          message: `Réponse API invalide : HTTP ${response.status} a été reçu au lieu de 204.`,
          status: response.status,
        },
      };
    }
    if (!options.validateData) {
      return {
        ok: false,
        failure: {
          message:
            "Configuration de requête invalide : aucun validateur de réponse n’a été fourni.",
        },
      };
    }
    return await parseResponse(response, options.validateData);
  } catch {
    return {
      ok: false,
      failure: {
        message: "L’API Librescence est indisponible ou injoignable depuis le navigateur.",
      },
    };
  }
}

export async function accountDownload(
  path: string,
  expectedMediaType: PortfolioAttachment["mediaType"],
): Promise<AccountResult<Blob>> {
  const url = apiUrl(path);
  if (!url) return { ok: false, failure: configFailure() };

  try {
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      redirect: "manual",
      headers: { Accept: expectedMediaType },
    });
    if (response.status === 401) {
      return {
        ok: false,
        failure: {
          message: "Votre session n’est pas ouverte ou a expiré. Connectez-vous pour continuer.",
          status: 401,
        },
      };
    }
    if (!response.ok) return { ok: false, failure: await readFailure(response) };

    const mediaType = response.headers.get("Content-Type")?.split(";")[0].trim();
    if (mediaType !== expectedMediaType) {
      return {
        ok: false,
        failure: {
          message: "Le type du fichier reçu ne correspond pas à la pièce jointe.",
          status: response.status,
        },
      };
    }
    return { ok: true, data: await response.blob() };
  } catch {
    return {
      ok: false,
      failure: {
        message: "L’API Librescence est indisponible ou injoignable depuis le navigateur.",
      },
    };
  }
}

export async function accountRequestPaginated<T>(
  path: string,
  validateData: Validator<T>,
): Promise<AccountResult<{ data: T; meta: PageMeta }>> {
  const url = apiUrl(path);
  if (!url) return { ok: false, failure: configFailure() };

  try {
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      redirect: "manual",
      headers: { Accept: "application/json, application/problem+json" },
    });
    if (response.status === 401) {
      return {
        ok: false,
        failure: {
          message: "Votre session n’est pas ouverte ou a expiré. Connectez-vous pour continuer.",
          status: 401,
        },
      };
    }
    if (!response.ok) {
      return { ok: false, failure: await readFailure(response) };
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return {
        ok: false,
        failure: {
          message: "Réponse API invalide : le contenu JSON est illisible.",
          status: response.status,
        },
      };
    }

    if (
      !isRecord(payload) ||
      !("data" in payload) ||
      !validateData(payload.data) ||
      !isPageMeta(payload.meta)
    ) {
      return {
        ok: false,
        failure: {
          message:
            "Réponse API invalide : données ou métadonnées de pagination non conformes au contrat.",
          status: response.status,
        },
      };
    }
    return { ok: true, data: { data: payload.data, meta: payload.meta } };
  } catch {
    return {
      ok: false,
      failure: {
        message: "L’API Librescence est indisponible ou injoignable depuis le navigateur.",
      },
    };
  }
}

export const isNullableData: Validator<null> = (value): value is null =>
  value === null;

export function isNoteData(value: unknown): value is { id: string; lessonId: string; body: string; updatedAt: string } {
  return isLearnerNote(value);
}

export function isSavedResourceData(value: unknown): value is SavedResource {
  return isSavedResource(value);
}
