/**
 * Excel-style color palette (Office theme):
 * 10 base colors, each with 5 variations (lighter/darker),
 * plus the "standard colors" row. Display names are user-facing (pt-BR).
 */

export interface ThemeColorColumn {
  name: string;
  base: string;
  shades: string[]; // from lightest to darkest
}

export const THEME_COLORS: ThemeColorColumn[] = [
  { name: "Branco",        base: "#FFFFFF", shades: ["#F2F2F2", "#D9D9D9", "#BFBFBF", "#A6A6A6", "#808080"] },
  { name: "Preto",         base: "#000000", shades: ["#808080", "#595959", "#404040", "#262626", "#0D0D0D"] },
  { name: "Cinza-claro",   base: "#E7E6E6", shades: ["#D0CECE", "#AEAAAA", "#767171", "#3A3838", "#171616"] },
  { name: "Azul-acinzentado", base: "#44546A", shades: ["#D6DCE5", "#ADB9CA", "#8497B0", "#333F50", "#222B35"] },
  { name: "Azul",          base: "#4472C4", shades: ["#DAE3F3", "#B4C7E7", "#8FAADC", "#2F5597", "#1F3864"] },
  { name: "Laranja",       base: "#ED7D31", shades: ["#FBE5D6", "#F8CBAD", "#F4B183", "#C55A11", "#843C0C"] },
  { name: "Cinza",         base: "#A5A5A5", shades: ["#EDEDED", "#DBDBDB", "#C9C9C9", "#7B7B7B", "#525252"] },
  { name: "Dourado",       base: "#FFC000", shades: ["#FFF2CC", "#FFE699", "#FFD966", "#BF9000", "#7F6000"] },
  { name: "Azul-claro",    base: "#5B9BD5", shades: ["#DEEBF7", "#BDD7EE", "#9DC3E6", "#2E75B6", "#1F4E79"] },
  { name: "Verde",         base: "#70AD47", shades: ["#E2F0D9", "#C5E0B4", "#A9D18E", "#548235", "#385723"] },
];

export const STANDARD_COLORS: { name: string; hex: string }[] = [
  { name: "Vermelho-escuro", hex: "#C00000" },
  { name: "Vermelho",        hex: "#FF0000" },
  { name: "Laranja",         hex: "#FFC000" },
  { name: "Amarelo",         hex: "#FFFF00" },
  { name: "Verde-claro",     hex: "#92D050" },
  { name: "Verde",           hex: "#00B050" },
  { name: "Azul-claro",      hex: "#00B0F0" },
  { name: "Azul",            hex: "#0070C0" },
  { name: "Azul-escuro",     hex: "#002060" },
  { name: "Roxo",            hex: "#7030A0" },
];

/** Default color for new tasks and milestones. */
export const DEFAULT_COLOR = "#4472C4";

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Normalizes a color input to "#RRGGBB" (uppercase).
 * Accepts "abc", "#abc", "aabbcc", "#aabbcc". Returns null when invalid.
 */
export function normalizeHex(input: string): string | null {
  const m = input.trim().match(HEX_RE);
  if (!m) return null;
  let hex = m[1];
  if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
  return `#${hex.toUpperCase()}`;
}

export function isValidHex(input: string): boolean {
  return normalizeHex(input) !== null;
}

/** Returns "#000000" or "#FFFFFF", whichever contrasts better with the given color. */
export function contrastTextColor(hex: string): string {
  const n = normalizeHex(hex);
  if (!n) return "#000000";
  const r = parseInt(n.slice(1, 3), 16);
  const g = parseInt(n.slice(3, 5), 16);
  const b = parseInt(n.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000000" : "#FFFFFF";
}
