import type {
  Domain,
  DomainDetail,
  Lesson,
  Pathway,
  PathwayWeek,
  PublicQuiz,
  Resource,
  SearchResult,
} from "@/lib/types";

export type Validator<T> = (value: unknown) => value is T;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringWithMaxLength(value: unknown, maxLength: number): value is string {
  return isString(value) && value.length <= maxLength;
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || isString(value);
}

function isOptionalStringWithMaxLength(
  value: unknown,
  maxLength: number,
): boolean {
  return value === undefined || isStringWithMaxLength(value, maxLength);
}

function isNullableString(value: unknown): boolean {
  return value === null || isString(value);
}

function isNullableStringWithMaxLength(
  value: unknown,
  maxLength: number,
): boolean {
  return value === null || isStringWithMaxLength(value, maxLength);
}

function isOptionalNullableStringWithMaxLength(
  value: unknown,
  maxLength: number,
): boolean {
  return (
    value === undefined || isNullableStringWithMaxLength(value, maxLength)
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isStringArrayWithMaxLength(
  value: unknown,
  maxLength: number,
): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => isStringWithMaxLength(item, maxLength))
  );
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === "number" && value > 0;
}

function isDomain(value: unknown): value is Domain {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.familyId) &&
    isString(value.name) &&
    isString(value.summary) &&
    value.availability === "published" &&
    isOptionalString(value.publishedAt)
  );
}

function isPathwaySummary(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.title) &&
    isPositiveInteger(value.version) &&
    value.status === "published"
  );
}

export const isDomainList: Validator<Domain[]> = (
  value,
): value is Domain[] => Array.isArray(value) && value.every(isDomain);

export const isDomainDetail: Validator<DomainDetail> = (
  value,
): value is DomainDetail => {
  if (!isRecord(value)) return false;
  const pathways = value.pathways;
  return (
    isDomain(value) &&
    Array.isArray(pathways) &&
    pathways.every(isPathwaySummary)
  );
};

function isQuizSummary(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isPositiveInteger(value.questionCount)
  );
}

function isLesson(value: unknown): value is Lesson {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isPositiveInteger(value.position) &&
    isString(value.title) &&
    isString(value.objective) &&
    isOptionalString(value.explanation) &&
    isOptionalString(value.activity) &&
    (value.durationMinutes === undefined ||
      value.durationMinutes === null ||
      isPositiveInteger(value.durationMinutes)) &&
    (value.resourceIds === undefined || isStringArray(value.resourceIds)) &&
    Array.isArray(value.quizzes) &&
    value.quizzes.every(isQuizSummary)
  );
}

function isPathwayWeek(value: unknown): value is PathwayWeek {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isPositiveInteger(value.position) &&
    isString(value.title) &&
    isOptionalString(value.label) &&
    Array.isArray(value.lessons) &&
    value.lessons.length > 0 &&
    value.lessons.every(isLesson)
  );
}

function isProjectChecklistItem(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value.stableKey) &&
    isPositiveInteger(value.position) &&
    isString(value.label)
  );
}

function isProjectBrief(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.title) &&
    isString(value.instructions) &&
    Array.isArray(value.checklist) &&
    value.checklist.every(isProjectChecklistItem)
  );
}

function isHttpUrl(value: unknown): value is string {
  if (!isString(value)) return false;
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function isSafePublicHttpsUrl(
  value: unknown,
  maxLength = 1000,
): value is string {
  if (
    !isString(value) ||
    value.length > maxLength ||
    value.trim() !== value ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return false;
  }
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return false;
    }

    // URL canonicalizes internationalized names to ASCII/punycode. Validate
    // that canonical hostname rather than the user-provided spelling.
    const hostname = url.hostname.toLowerCase();

    if (hostname.startsWith("[") && hostname.endsWith("]")) {
      return isPublicIpLiteral(hostname);
    }

    if (/^(?:\d+(?:\.\d+){0,3}|0x[0-9a-f]+)$/i.test(hostname)) {
      return isPublicIpLiteral(hostname);
    }

    if (!isValidDnsHostname(hostname)) return false;

    const localHostnameSuffixes = [
      "localhost",
      "local",
      "localdomain",
      "lan",
      "intranet",
      "internal",
      "test",
      "example",
      "invalid",
      "home.arpa",
      "arpa",
      "onion",
    ];

    return !localHostnameSuffixes.some(
      (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`),
    );
  } catch {
    return false;
  }
}

function isValidDnsHostname(hostname: string): boolean {
  // Reject root dots rather than normalizing them: more than one trailing
  // dot, or an empty label anywhere, must never be treated as a public host.
  if (hostname.length > 253 || hostname.startsWith(".") || hostname.endsWith(".")) {
    return false;
  }

  const labels = hostname.split(".");
  if (
    labels.length < 2 ||
    !labels.every(
      (label) =>
        label.length >= 1 &&
        label.length <= 63 &&
        /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label),
    )
  ) {
    return false;
  }

  try {
    const parsed = new URL(`https://${hostname}/`);
    const canonicalHostname = parsed.hostname.toLowerCase();
    return (
      canonicalHostname === hostname &&
      canonicalHostname.split(".").every((label) =>
        !label.startsWith("xn--") || isCanonicalALabel(label),
      )
    );
  } catch {
    return false;
  }
}

function isCanonicalALabel(label: string): boolean {
  const unicodeLabel = decodePunycode(label.slice(4));
  if (unicodeLabel === null) return false;

  try {
    // Let the browser's IDNA implementation validate and re-encode the
    // decoded label. It must round-trip to the exact canonical A-label.
    return (
      new URL(`https://${unicodeLabel}.invalid/`).hostname.toLowerCase() ===
      `${label}.invalid`
    );
  } catch {
    return false;
  }
}

function decodePunycode(input: string): string | null {
  const base = 36;
  const tMin = 1;
  const tMax = 26;
  const initialN = 128;
  const initialBias = 72;
  const delimiter = input.lastIndexOf("-");
  const output: number[] = [];
  let index = 0;

  if (delimiter >= 0) {
    for (let position = 0; position < delimiter; position += 1) {
      const codePoint = input.charCodeAt(position);
      if (codePoint >= 0x80) return null;
      output.push(codePoint);
    }
    index = delimiter + 1;
  }

  let n = initialN;
  let insertionIndex = 0;
  let bias = initialBias;

  while (index < input.length) {
    const oldIndex = insertionIndex;
    let weight = 1;

    for (let k = base; ; k += base) {
      if (index >= input.length) return null;
      const digit = decodePunycodeDigit(input.charCodeAt(index));
      index += 1;
      if (digit < 0 || digit > Math.floor((Number.MAX_SAFE_INTEGER - insertionIndex) / weight)) {
        return null;
      }
      insertionIndex += digit * weight;

      const threshold =
        k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
      if (digit < threshold) break;
      const multiplier = base - threshold;
      if (weight > Math.floor(Number.MAX_SAFE_INTEGER / multiplier)) {
        return null;
      }
      weight *= multiplier;
    }

    const outputLength = output.length + 1;
    bias = adaptPunycodeBias(insertionIndex - oldIndex, outputLength, oldIndex === 0);
    if (!Number.isSafeInteger(bias) || bias < 0) return null;
    const increment = Math.floor(insertionIndex / outputLength);
    if (increment > 0x10ffff - n) return null;
    n += increment;
    insertionIndex %= outputLength;
    if (n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff)) return null;
    output.splice(insertionIndex, 0, n);
    insertionIndex += 1;
  }

  try {
    return String.fromCodePoint(...output);
  } catch {
    return null;
  }
}

function decodePunycodeDigit(codePoint: number): number {
  if (codePoint >= 0x61 && codePoint <= 0x7a) return codePoint - 0x61;
  if (codePoint >= 0x41 && codePoint <= 0x5a) return codePoint - 0x41;
  if (codePoint >= 0x30 && codePoint <= 0x39) return codePoint - 0x30 + 26;
  return -1;
}

function adaptPunycodeBias(delta: number, points: number, first: boolean): number {
  const base = 36;
  const tMin = 1;
  const tMax = 26;
  const skew = 38;
  const damp = 700;
  delta = Math.floor(delta / (first ? damp : 2)) + Math.floor(delta / points);
  if (!Number.isSafeInteger(delta)) return -1;
  let k = 0;

  while (delta > Math.floor(((base - tMin) * tMax) / 2)) {
    delta = Math.floor(delta / (base - tMin));
    k += base;
  }
  return k + Math.floor(((base - tMin + 1) * delta) / (delta + skew));
}

export function isPublicIpLiteral(value: string): boolean {
  const address = value.startsWith("[") && value.endsWith("]")
    ? value.slice(1, -1)
    : value;

  if (address.includes(":")) return isPublicIpv6(address);
  if (/^(?:\d+(?:\.\d+){0,3}|0x[0-9a-f]+)$/i.test(address)) {
    return isPublicIpv4(address);
  }

  return false;
}

function isPublicIpv4(value: string): boolean {
  const parts = value.split(".");
  if (
    parts.length !== 4 ||
    parts.some((part) => !/^(0|[1-9]\d{0,2})$/.test(part))
  ) {
    return false;
  }
  const octets = parts.map(Number);
  if (octets.some((octet) => octet > 255)) return false;

  const address =
    octets[0] * 0x1000000 +
    octets[1] * 0x10000 +
    octets[2] * 0x100 +
    octets[3];
  const inRange = (network: number, prefixLength: number) =>
    Math.floor(address / 2 ** (32 - prefixLength)) ===
    Math.floor(network / 2 ** (32 - prefixLength));

  const restrictedRanges: Array<[number, number]> = [
    [0x00000000, 8], // "This" network
    [0x0a000000, 8], // Private
    [0x64400000, 10], // Shared address space
    [0x7f000000, 8], // Loopback
    [0xa9fe0000, 16], // Link-local
    [0xac100000, 12], // Private
    [0xc0000000, 24], // IETF protocol assignments
    [0xc0000200, 24], // Documentation
    [0xc0586300, 24], // Deprecated 6to4 relay anycast
    [0xc0a80000, 16], // Private
    [0xc6120000, 15], // Benchmarking
    [0xc6336400, 24], // Documentation
    [0xcb007100, 24], // Documentation
    [0xe0000000, 4], // Multicast
    [0xf0000000, 4], // Reserved / broadcast
  ];

  return !restrictedRanges.some(([network, prefixLength]) =>
    inRange(network, prefixLength),
  );
}

function isPublicIpv6(value: string): boolean {
  const normalized = value.toLowerCase();
  const addressWithIpv4Tail = normalized.includes(".");
  let address = normalized;

  if (addressWithIpv4Tail) {
    const lastColon = address.lastIndexOf(":");
    const ipv4Tail = address.slice(lastColon + 1);
    if (!isPublicIpv4(ipv4Tail)) return false;
    const octets = ipv4Tail.split(".").map(Number);
    const firstHextet = ((octets[0] << 8) | octets[1]).toString(16);
    const secondHextet = ((octets[2] << 8) | octets[3]).toString(16);
    address = `${address.slice(0, lastColon + 1)}${firstHextet}:${secondHextet}`;
  }

  const halves = address.split("::");
  if (halves.length > 2) return false;
  const parseHalf = (half: string): number[] | null => {
    if (!half) return [];
    const groups = half.split(":");
    if (groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) return null;
    return groups.map((group) => Number.parseInt(group, 16));
  };
  const left = parseHalf(halves[0]);
  const right = parseHalf(halves[1] ?? "");
  if (!left || !right) return false;

  const missingGroups = 8 - left.length - right.length;
  if (
    (halves.length === 1 && missingGroups !== 0) ||
    (halves.length === 2 && missingGroups < 1)
  ) {
    return false;
  }
  const groups = [...left, ...Array(missingGroups).fill(0), ...right];
  if (groups.length !== 8) return false;
  const bytes = groups.flatMap((group) => [group >> 8, group & 0xff]);
  const matchesPrefix = (prefix: number[], prefixLength: number) => {
    const wholeBytes = Math.floor(prefixLength / 8);
    const remainingBits = prefixLength % 8;
    for (let index = 0; index < wholeBytes; index += 1) {
      if (bytes[index] !== prefix[index]) return false;
    }
    if (remainingBits > 0) {
      const mask = (0xff << (8 - remainingBits)) & 0xff;
      if ((bytes[wholeBytes] & mask) !== (prefix[wholeBytes] & mask)) {
        return false;
      }
    }
    return true;
  };

  // Only global-unicast IPv6 addresses are eligible; exclude special-purpose
  // and documentation allocations within that range as well.
  return (
    matchesPrefix([0x20], 3) &&
    !matchesPrefix([0x20, 0x01], 23) &&
    !matchesPrefix([0x20, 0x01, 0x0d, 0xb8], 32) &&
    !matchesPrefix([0x20, 0x01, 0x00, 0x02], 48) &&
    !matchesPrefix([0x20, 0x02], 16) &&
    !matchesPrefix([0x3f, 0xff], 20)
  );
}

function isResource(value: unknown): value is Resource {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.title) &&
    isHttpUrl(value.url) &&
    (value.provider === undefined || isNullableString(value.provider)) &&
    (value.language === undefined || isNullableString(value.language)) &&
    ["article", "course", "video", "search", "document", "other"].includes(
      String(value.kind),
    ) &&
    (value.accessNote === undefined || isNullableString(value.accessNote)) &&
    ["verified", "unverified"].includes(String(value.verificationStatus))
  );
}

function isCompletionPolicy(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.allLessonsRequired === "boolean" &&
    isStringArray(value.requiredQuizIds) &&
    (value.minimumScorePercent === undefined ||
      value.minimumScorePercent === null ||
      (Number.isInteger(value.minimumScorePercent) &&
        typeof value.minimumScorePercent === "number" &&
        value.minimumScorePercent >= 0 &&
        value.minimumScorePercent <= 100))
  );
}

export const isPathway: Validator<Pathway> = (
  value,
): value is Pathway => {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isStringWithMaxLength(value.domainId, 100) ||
    !isStringWithMaxLength(value.title, 180) ||
    !isNullableStringWithMaxLength(value.eyebrow, 180) ||
    !isPositiveInteger(value.version) ||
    value.status !== "published" ||
    !Array.isArray(value.weeks) ||
    value.weeks.length === 0 ||
    !value.weeks.every(isPathwayWeek) ||
    !Array.isArray(value.projects) ||
    !value.projects.every(isProjectBrief) ||
    !isStringArrayWithMaxLength(value.skills, 240) ||
    !isStringArrayWithMaxLength(value.careerExamples, 240)
  ) {
    return false;
  }

  return (
    isOptionalStringWithMaxLength(value.description, 5000) &&
    isOptionalStringWithMaxLength(value.overview, 3000) &&
    isOptionalStringWithMaxLength(value.difficulty, 60) &&
    isOptionalNullableStringWithMaxLength(value.weeklyTime, 120) &&
    isOptionalNullableStringWithMaxLength(value.safetyNote, 2000) &&
    (value.prerequisites === undefined ||
      isStringArrayWithMaxLength(value.prerequisites, 500)) &&
    (value.equipment === undefined ||
      isStringArrayWithMaxLength(value.equipment, 500)) &&
    (value.completionPolicy === undefined ||
      value.completionPolicy === null ||
      isCompletionPolicy(value.completionPolicy)) &&
    (value.resources === undefined ||
      (Array.isArray(value.resources) && value.resources.every(isResource)))
  );
};

export const isSearchResultList: Validator<SearchResult[]> = (
  value,
): value is SearchResult[] =>
  Array.isArray(value) &&
  value.every(
    (result) =>
      isRecord(result) &&
      ["domain", "pathway", "lesson", "resource"].includes(
        String(result.type),
      ) &&
      isString(result.id) &&
      isString(result.title) &&
      isOptionalString(result.summary) &&
      isOptionalString(result.domainId) &&
      result.availability === "published",
  );

function hasOnlyKeys(
  value: Record<string, unknown>,
  allowed: string[],
): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

export const isPublicQuiz: Validator<PublicQuiz> = (
  value,
): value is PublicQuiz => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["id", "lessonId", "version", "questions"]) ||
    !isString(value.id) ||
    !isString(value.lessonId) ||
    !isPositiveInteger(value.version) ||
    !Array.isArray(value.questions) ||
    value.questions.length === 0
  ) {
    return false;
  }

  return value.questions.every(
    (question) =>
      isRecord(question) &&
      hasOnlyKeys(question, ["id", "prompt", "options"]) &&
      isString(question.id) &&
      isString(question.prompt) &&
      Array.isArray(question.options) &&
      question.options.length >= 2 &&
      question.options.every(
        (option) =>
          isRecord(option) &&
          hasOnlyKeys(option, ["id", "label"]) &&
          isString(option.id) &&
          isString(option.label),
      ),
  );
};
