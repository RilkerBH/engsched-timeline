"use client"

import { useEffect, useState } from "react"
import { Check, Pipette } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  THEME_COLORS,
  STANDARD_COLORS,
  normalizeHex,
  contrastTextColor,
} from "@/lib/colors"

type ColorPickerProps = {
  value: string
  onChange: (hex: string) => void
  /** Texto do botão quando não há cor (ex.: edição em bloco). */
  placeholder?: string
  className?: string
  disabled?: boolean
}

function Swatch({ hex, selected, title, onSelect, size = "md" }: {
  hex: string
  selected: boolean
  title: string
  onSelect: (hex: string) => void
  size?: "sm" | "md"
}) {
  return (
    <button
      type="button"
      title={`${title} ${hex}`}
      aria-label={`${title} ${hex}`}
      onClick={() => onSelect(hex)}
      className={cn(
        "relative rounded-sm border border-black/15 transition-transform hover:scale-110 hover:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        size === "sm" ? "h-5 w-5" : "h-6 w-6",
        selected && "ring-2 ring-ring ring-offset-1"
      )}
      style={{ backgroundColor: hex }}
    >
      {selected && (
        <Check className="absolute inset-0 m-auto h-3 w-3" style={{ color: contrastTextColor(hex) }} />
      )}
    </button>
  )
}

/**
 * Seletor de cores no estilo do Excel: cores do tema, cores padrão,
 * campo para digitar o código hexadecimal e acesso ao seletor nativo.
 */
export function ColorPicker({ value, onChange, placeholder = "Selecionar cor", className, disabled }: ColorPickerProps) {
  const [open, setOpen] = useState(false)
  const current = normalizeHex(value || "")
  const [hexInput, setHexInput] = useState(current ?? "")
  const [hexError, setHexError] = useState(false)

  useEffect(() => {
    setHexInput(current ?? "")
    setHexError(false)
  }, [current, open])

  const select = (hex: string) => {
    const n = normalizeHex(hex)
    if (!n) return
    onChange(n)
    setOpen(false)
  }

  const applyHexInput = () => {
    const n = normalizeHex(hexInput)
    if (!n) {
      setHexError(true)
      return
    }
    setHexError(false)
    select(n)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn("w-full justify-start gap-2 font-normal", className)}
        >
          {current ? (
            <>
              <span className="h-4 w-4 rounded-sm border border-black/15" style={{ backgroundColor: current }} />
              <span className="font-mono text-xs">{current}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Cores do tema</p>
            <div className="grid grid-cols-10 gap-1">
              {THEME_COLORS.map(col => (
                <Swatch key={col.base} hex={col.base} title={col.name} selected={current === col.base} onSelect={select} />
              ))}
              {[0, 1, 2, 3, 4].map(row =>
                THEME_COLORS.map(col => {
                  const hex = col.shades[row]
                  return (
                    <Swatch key={hex + col.name} hex={hex} title={col.name} selected={current === hex} onSelect={select} size="sm" />
                  )
                })
              )}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Cores padrão</p>
            <div className="grid grid-cols-10 gap-1">
              {STANDARD_COLORS.map(c => (
                <Swatch key={c.hex} hex={c.hex} title={c.name} selected={current === c.hex} onSelect={select} />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Código hexadecimal</p>
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 shrink-0 rounded-sm border border-black/15" style={{ backgroundColor: normalizeHex(hexInput) ?? "transparent" }} />
              <Input
                value={hexInput}
                onChange={e => { setHexInput(e.target.value); setHexError(false) }}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); applyHexInput() } }}
                placeholder="#RRGGBB"
                maxLength={7}
                className={cn("h-8 font-mono text-xs", hexError && "border-destructive focus-visible:ring-destructive")}
                aria-invalid={hexError}
              />
              <label
                title="Mais cores..."
                className="relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border hover:bg-accent"
              >
                <Pipette className="h-4 w-4" />
                <input
                  type="color"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  value={current ?? "#000000"}
                  onChange={e => { onChange(normalizeHex(e.target.value) ?? e.target.value) }}
                />
              </label>
              <Button type="button" size="sm" className="h-8" onClick={applyHexInput}>OK</Button>
            </div>
            {hexError && <p className="mt-1 text-xs text-destructive">Use o formato #RRGGBB (ex.: #1F77B4).</p>}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
