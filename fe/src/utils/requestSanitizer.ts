export function sanitizeRequestValue(value: unknown): unknown {
  if (typeof value === "string") return value.trim();
  if (value == null || typeof value !== "object") return value;
  if (value instanceof Date || value instanceof Blob || value instanceof File) {
    return value;
  }
  if (value instanceof URLSearchParams) {
    const sanitized = new URLSearchParams();
    value.forEach((entryValue, key) => sanitized.append(key, entryValue.trim()));
    return sanitized;
  }
  if (value instanceof FormData) {
    const sanitized = new FormData();
    value.forEach((entryValue, key) => {
      if (typeof entryValue === "string") sanitized.append(key, entryValue.trim());
      else sanitized.append(key, entryValue, entryValue.name);
    });
    return sanitized;
  }
  if (Array.isArray(value)) return value.map(sanitizeRequestValue);
  const sanitized: Record<string, unknown> = {};
  Object.entries(value as Record<string, unknown>).forEach(([key, entryValue]) => {
    sanitized[key] = sanitizeRequestValue(entryValue);
  });
  return sanitized;
}

