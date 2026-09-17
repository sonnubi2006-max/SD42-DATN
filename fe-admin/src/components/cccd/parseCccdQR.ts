export interface CccdData {
  cccd: string;
  fullName: string;
  birthday: string;
  gender: "MALE" | "FEMALE";
  streetAddress?: string;
  province?: string;
  district?: string;
  ward?: string;
}

const CCCD_PATTERN = /^\d{12}$/;

function normalizeBirthday(value: string): string {
  const birthday = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(birthday)) return birthday;

  const match = birthday.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (!match) throw new Error("Invalid CCCD birthday");

  const [, day, month, year] = match;
  const normalized = `${year}-${month}-${day}`;
  const date = new Date(`${normalized}T00:00:00`);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== Number(year) ||
    date.getMonth() + 1 !== Number(month) ||
    date.getDate() !== Number(day)
  ) {
    throw new Error("Invalid CCCD birthday");
  }
  return normalized;
}

function normalizeGender(value: string): "MALE" | "FEMALE" {
  const gender = value.trim().toLocaleLowerCase("vi-VN");
  if (gender === "male" || gender === "nam") return "MALE";
  if (gender === "female" || gender === "nữ" || gender === "nu") return "FEMALE";
  throw new Error("Invalid CCCD gender");
}

function parseAddress(address: string) {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.at(-1)?.toLocaleLowerCase("vi-VN") === "việt nam") parts.pop();

  return {
    province: parts.length >= 1 ? parts.at(-1) ?? "" : "",
    district: parts.length >= 2 ? parts.at(-2) ?? "" : "",
    ward: parts.length >= 3 ? parts.at(-3) ?? "" : "",
    streetAddress: parts.length >= 4 ? parts.slice(0, -3).join(", ") : "",
  };
}

function parsePipeFormat(text: string): CccdData {
  const parts = text.split("|").map((part) => part.trim());
  if (parts.length < 7) throw new Error("Invalid CCCD QR format");

  const [cccd, , fullName, birthday, gender, address] = parts;
  if (!CCCD_PATTERN.test(cccd) || !fullName || !address) {
    throw new Error("Invalid CCCD QR format");
  }

  return {
    cccd,
    fullName,
    birthday: normalizeBirthday(birthday),
    gender: normalizeGender(gender),
    ...parseAddress(address),
  };
}

export function parseCccdQR(text: string): CccdData {
  const normalizedText = text.trim();
  if (normalizedText.includes("|")) return parsePipeFormat(normalizedText);

  const map: Record<string, string> = {};

  normalizedText.split(";").forEach((item) => {
    const [key, ...rest] = item.split("=");
    if (!key || rest.length === 0) return;
    map[key.trim()] = rest.join("=").trim();
  });

  if (!map.fullName || !map.birthday || !map.gender || !CCCD_PATTERN.test(map.cccd)) {
    throw new Error("Invalid CCCD QR format");
  }

  return {
    fullName: map.fullName,
    birthday: normalizeBirthday(map.birthday),
    gender: normalizeGender(map.gender),
    cccd: map.cccd,
    streetAddress: map.streetAddress ?? "",
    province: map.province ?? "",
    district: map.district ?? "",
    ward: map.ward ?? "",
  };
}
