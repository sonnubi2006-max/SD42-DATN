export interface GeneratedCombo {
  color: string;
  size: string;
  price?: number;
  stockQuantity?: number;

  file?: File;
}

import { normalizeLabel } from "./constants";

export function comboKey(color: string, size: string): string {
  return `${normalizeLabel(color)}|${normalizeLabel(size)}`;
}
