"use client"

import { AArrowDown, AArrowUp, RotateCcw, Type } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { FontRole, FontSizes } from "@/domain/types"
import { FONT_ROLES, FONT_SIZE, resolveFontSizes, stepFontSizes } from "@/domain/typography"

type FontSizeMenuProps = {
  fontSizes?: FontSizes
  onChange: (fontSizes: FontSizes) => void
}

/** "Fontes" popover: grow/shrink every text of the timeline at once, or each kind of text on its own. */
export function FontSizeMenu({ fontSizes, onChange }: FontSizeMenuProps) {
  const sizes = resolveFontSizes(fontSizes)
  const allRoles = FONT_ROLES.map(r => r.role)
  const step = (roles: FontRole[], direction: 1 | -1) => onChange(stepFontSizes(fontSizes, roles, direction))
  const isDefault = Object.keys(fontSizes ?? {}).length === 0

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Type className="mr-2 h-4 w-4" />
          Fontes
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <div className="space-y-1 text-sm">
          <FontRow
            label="Todas as fontes"
            strong
            onStep={(d) => step(allRoles, d)}
            canShrink={allRoles.some(r => sizes[r] > FONT_SIZE.min)}
            canGrow={allRoles.some(r => sizes[r] < FONT_SIZE.max)}
          />
          <div className="my-2 h-px bg-border" />
          {FONT_ROLES.map(({ role, label }) => (
            <FontRow
              key={role}
              label={label}
              value={sizes[role]}
              onStep={(d) => step([role], d)}
              canShrink={sizes[role] > FONT_SIZE.min}
              canGrow={sizes[role] < FONT_SIZE.max}
            />
          ))}
          <div className="my-2 h-px bg-border" />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">Para itens específicos, selecione-os e use A−/A+ na barra de seleção.</p>
            <Button variant="ghost" size="sm" className="h-8 shrink-0" disabled={isDefault} onClick={() => onChange({})}>
              <RotateCcw className="mr-1 h-3.5 w-3.5" /> Padrão
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

type FontRowProps = {
  label: string
  value?: number
  strong?: boolean
  canShrink: boolean
  canGrow: boolean
  onStep: (direction: 1 | -1) => void
}

function FontRow({ label, value, strong, canShrink, canGrow, onStep }: FontRowProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={strong ? "font-medium" : "text-muted-foreground"}>{label}</span>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="outline" className="h-7 w-7" title="Diminuir fonte" disabled={!canShrink} onClick={() => onStep(-1)}>
          <AArrowDown className="h-4 w-4" />
        </Button>
        {value !== undefined && <span className="w-10 text-center font-mono text-xs">{value}px</span>}
        <Button size="icon" variant="outline" className="h-7 w-7" title="Aumentar fonte" disabled={!canGrow} onClick={() => onStep(1)}>
          <AArrowUp className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
