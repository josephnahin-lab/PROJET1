const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

export const apiBaseUrl = (configuredApiBaseUrl || "/api/v1").replace(/\/+$/, "");
