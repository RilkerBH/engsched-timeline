"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, CalendarClock, CheckSquare, ChevronDown, RotateCcw, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ColorPicker } from "@/components/color-picker"
import type { Selection } from "@/lib/bulk"

type DateFormat = "dd/MM/yyyy" | "MMM/yy"

type SelectionToolbarProps = {
  selection: Selection
  totalPackages: number
  totalMilestones: number
  onClear: () => void
  onSelectAll: () => void
  onColor: (hex: string) => void
  onDateFormat: (fmt: DateFormat) => void
  onMove: (direction: "up" | "down") => void
  onShiftDates: (days: number) => void
  onShowTextInside: (value: boolean) => void
  onPreventLineBreak: (value: boolean) => void
  onResetLabels: () => void
  onDelete: () => void
}

export function SelectionToolbar({
  selection, totalPackages, totalMilestones,
  onClear, onSelectAll, onColor, onDateFormat, onMove, onShiftDates,
  onShowTextInside, onPreventLineBreak, onResetLabels, onDelete,
}: SelectionToolbarProps) {
  const [shiftDays, setShiftDays] = useState("7")
  const nPk = selection.packages.length
  const nMs = selection.milestones.length
  const hasPackages = nPk > 0
  const allSelected = nPk === totalPackages && nMs === totalMilestones

  const summary = [
    nPk > 0 ? `${nPk} pacote${nPk > 1 ? "s" : ""}` : null,
    nMs > 0 ? `${nMs} marco${nMs > 1 ? "s" : ""}` : null,
  ].filter(Boolean).join(" e ")

  const shift = (sign: 1 | -1) => {
    const n = parseInt(shiftDays, 10)
    if (!Number.isFinite(n) || n <= 0) return
    onShiftDates(sign * n)
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border border-primary/40 bg-primary/5 px-4 py-2 text-sm">
      <div className="flex items-center gap-2 font-medium">
        <CheckSquare className="h-4 w-4 text-primary" />
        <span>{summary} selecionado{nPk + nMs > 1 ? "s" : ""}</span>
      </div>

      <div className="h-5 w-px bg-border" />

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Cor</span>
        <ColorPicker value="" onChange={onColor} placeholder="Alterar cor" className="h-8 w-[130px]" />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Formato da data</span>
        <Select onValueChange={(v) => onDateFormat(v as DateFormat)}>
          <SelectTrigger className="h-8 w-[130px]">
            <SelectValue placeholder="Alterar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dd/MM/yyyy">dd/MM/yyyy</SelectItem>
            <SelectItem value="MMM/yy">MMM/yy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1">
        <span className="mr-1 text-muted-foreground">Deslocar</span>
        <Button size="icon" variant="outline" className="h-8 w-8" title="Adiantar N dias" onClick={() => shift(-1)}>
          <span className="font-mono">−</span>
        </Button>
        <Input
          type="number"
          min={1}
          value={shiftDays}
          onChange={e => setShiftDays(e.target.value)}
          className="h-8 w-16 text-center"
          aria-label="Dias para deslocar"
        />
        <Button size="icon" variant="outline" className="h-8 w-8" title="Atrasar N dias" onClick={() => shift(1)}>
          <span className="font-mono">+</span>
        </Button>
        <CalendarClock className="ml-1 h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">dias</span>
      </div>

      {hasPackages && (
        <div className="flex items-center gap-1">
          <span className="mr-1 text-muted-foreground">Ordem</span>
          <Button size="icon" variant="outline" className="h-8 w-8" title="Mover bloco para cima" onClick={() => onMove("up")}>
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" className="h-8 w-8" title="Mover bloco para baixo" onClick={() => onMove("down")}>
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            Mais <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={onResetLabels}>
            <RotateCcw className="mr-2 h-4 w-4" /> Redefinir posição dos textos
          </DropdownMenuItem>
          {hasPackages && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Nome dentro da barra</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onShowTextInside(true)}>Ativar</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShowTextInside(false)}>Desativar</DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Quebra de linha do nome</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onPreventLineBreak(false)}>Permitir</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPreventLineBreak(true)}>Impedir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="ml-auto flex items-center gap-1">
        {!allSelected && (
          <Button variant="ghost" size="sm" className="h-8" onClick={onSelectAll}>
            Selecionar todos
          </Button>
        )}
        <Button variant="destructive" size="sm" className="h-8" onClick={onDelete}>
          <Trash2 className="mr-1 h-4 w-4" /> Excluir
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Limpar seleção (Esc)" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
