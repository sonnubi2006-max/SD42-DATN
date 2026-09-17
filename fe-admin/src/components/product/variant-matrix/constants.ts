import type { GeneratedCombo } from "./types";

export const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free size"];

export function normalizeLabel(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim()
    .toLowerCase();
}

export interface DefaultValues {
  price: number | undefined;
  stock: number;
}

export interface ColorOption {
  name: string;
  hex: string;
}

export const PRESET_COLORS: ColorOption[] = [
  { name: "Đen", hex: "#111827" },
  { name: "Trắng", hex: "#ffffff" },
  { name: "Be", hex: "#e7d8c0" },
  { name: "Navy", hex: "#1e293b" },
  { name: "Xám", hex: "#9ca3af" },
  { name: "Nâu", hex: "#8b5e3c" },
];

export function buildCombos(
  colors: ColorOption[],
  sizes: string[],
  defaults: DefaultValues,
  existingKeys: Set<string>,
): { combos: GeneratedCombo[]; skipped: number } {
  const combos: GeneratedCombo[] = [];
  let skipped = 0;
  for (const color of colors) {
    for (const size of sizes) {
      const key = `${normalizeLabel(color.name)}|${normalizeLabel(size)}`;
      if (existingKeys.has(key)) {
        skipped++;
        continue;
      }
      combos.push({
        color: color.name,
        size,
        price: defaults.price,
        stockQuantity: defaults.stock,
      });
    }
  }
  return { combos, skipped };
}
