import type { MilestoneData, ServicePackageData } from "./types";

/**
 * Layout padrão dos rótulos (nome e data) de pacotes e marcos.
 *
 * A posição-base de cada rótulo é definida aqui e nos componentes de
 * renderização. Os campos `labelOffset*` / `dateLabelOffset*` dos itens são
 * apenas o AJUSTE MANUAL feito pelo usuário ao arrastar; por padrão valem 0,
 * de modo que um item novo já nasce alinhado sem precisar de correção.
 *
 * Todas as medidas em px. Texto dos rótulos: 12px com linha de 16px.
 */
export const LABEL_LAYOUT = {
  package: {
    /** Modo "nome fora": nome e data à direita da barra, empilhados no centro vertical. */
    outside: {
      /** Distância horizontal entre o fim da barra e o início do texto. */
      gapX: 8,
      /** Distância entre o centro vertical da barra e a base do nome (acima). */
      nameAboveCenter: 1,
      /** Distância entre o centro vertical da barra e o topo da data (abaixo). */
      dateBelowCenter: 1,
    },
    /** Modo "nome dentro": nome centralizado na barra, data centralizada logo abaixo. */
    inside: {
      /** Distância entre a base da barra e o topo da data. */
      dateBelowBar: 2,
    },
  },
  milestone: {
    /** Distância entre o topo do triângulo e a base da data. */
    dateAboveMarker: 2,
    /** Distância entre o topo do triângulo e a base do nome (fica acima da data). */
    nameAboveMarker: 20,
  },
} as const;

export interface LabelOffsets {
  labelOffsetX: number;
  labelOffsetY: number;
  dateLabelOffsetX: number;
  dateLabelOffsetY: number;
}

export const ZERO_OFFSETS: LabelOffsets = {
  labelOffsetX: 0,
  labelOffsetY: 0,
  dateLabelOffsetX: 0,
  dateLabelOffsetY: 0,
};

export function resetLabelOffsets<T extends LabelOffsets>(item: T): T {
  return { ...item, ...ZERO_OFFSETS };
}

// ---------------------------------------------------------------------------
// Migração do esquema de rótulos 1 (até a v1.3.0) para o esquema 2.
//
// No esquema 1 os valores padrão não eram zero e as posições-base eram
// outras. Itens que ainda estão exatamente no padrão antigo passam para o
// novo padrão (0). Itens ajustados manualmente recebem offsets convertidos
// para que a posição na tela fique IGUAL à que tinham antes.
// ---------------------------------------------------------------------------

export const LABEL_SCHEMA_VERSION = 2;

const LEGACY_PACKAGE_DEFAULTS: LabelOffsets = { labelOffsetX: 10, labelOffsetY: 0, dateLabelOffsetX: 10, dateLabelOffsetY: 15 };
const LEGACY_MILESTONE_DEFAULTS: LabelOffsets = { labelOffsetX: 0, labelOffsetY: -10, dateLabelOffsetX: 0, dateLabelOffsetY: 15 };

const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

function readOffsets(item: Partial<LabelOffsets>, legacy: LabelOffsets): LabelOffsets {
  return {
    labelOffsetX: num(item.labelOffsetX, legacy.labelOffsetX),
    labelOffsetY: num(item.labelOffsetY, legacy.labelOffsetY),
    dateLabelOffsetX: num(item.dateLabelOffsetX, legacy.dateLabelOffsetX),
    dateLabelOffsetY: num(item.dateLabelOffsetY, legacy.dateLabelOffsetY),
  };
}

function sameOffsets(a: LabelOffsets, b: LabelOffsets): boolean {
  return a.labelOffsetX === b.labelOffsetX && a.labelOffsetY === b.labelOffsetY
    && a.dateLabelOffsetX === b.dateLabelOffsetX && a.dateLabelOffsetY === b.dateLabelOffsetY;
}

/**
 * Converte os offsets de um pacote do esquema 1 para o 2.
 *
 * Posições antigas (esquema 1), modo "fora":
 *   nome:  x = fimBarra + offX + 8 (padding)   base do texto = centro - 8 + offY
 *   data:  x = fimBarra + offX                 topo do texto = centro + offY
 * Posições novas (esquema 2), modo "fora":
 *   nome:  x = fimBarra + gapX + offX          base do texto = centro - nameAboveCenter + offY
 *   data:  x = fimBarra + gapX + offX          topo do texto = centro + dateBelowCenter + offY
 * Modo "dentro": nome idêntico; data antiga ficava em base+4+offY, nova em base+dateBelowBar+offY.
 */
export function migratePackageLabelOffsets(pkg: ServicePackageData): ServicePackageData {
  const old = readOffsets(pkg, LEGACY_PACKAGE_DEFAULTS);
  if (sameOffsets(old, LEGACY_PACKAGE_DEFAULTS)) return { ...pkg, ...ZERO_OFFSETS };

  const { outside, inside } = LABEL_LAYOUT.package;
  if (pkg.showTextInside) {
    return {
      ...pkg,
      labelOffsetX: old.labelOffsetX,
      labelOffsetY: old.labelOffsetY,
      dateLabelOffsetX: old.dateLabelOffsetX,
      dateLabelOffsetY: old.dateLabelOffsetY + 4 - inside.dateBelowBar,
    };
  }
  return {
    ...pkg,
    labelOffsetX: old.labelOffsetX + 8 - outside.gapX,
    labelOffsetY: old.labelOffsetY - 8 + outside.nameAboveCenter,
    dateLabelOffsetX: old.dateLabelOffsetX - outside.gapX,
    dateLabelOffsetY: old.dateLabelOffsetY - outside.dateBelowCenter,
  };
}

/**
 * Converte os offsets de um marco do esquema 1 para o 2.
 *
 * Antigo: nome e data com base em `bottom: 4px` e `translateY(offY)` (positivo = para baixo),
 *         ou seja, base do texto = topoTriângulo + 4 - offY.
 * Novo:   nome em `bottom: nameAboveMarker`, data em `bottom: dateAboveMarker`.
 */
export function migrateMilestoneLabelOffsets(m: MilestoneData): MilestoneData {
  const old = readOffsets(m, LEGACY_MILESTONE_DEFAULTS);
  if (sameOffsets(old, LEGACY_MILESTONE_DEFAULTS)) return { ...m, ...ZERO_OFFSETS };

  const { nameAboveMarker, dateAboveMarker } = LABEL_LAYOUT.milestone;
  return {
    ...m,
    labelOffsetX: old.labelOffsetX,
    labelOffsetY: old.labelOffsetY + (nameAboveMarker - 4),
    dateLabelOffsetX: old.dateLabelOffsetX,
    dateLabelOffsetY: old.dateLabelOffsetY + (dateAboveMarker - 4),
  };
}
