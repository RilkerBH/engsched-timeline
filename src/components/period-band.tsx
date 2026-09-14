"use client"

import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { RectangleVertical } from "lucide-react"
import type { PeriodData } from "@/domain/types"
import { hexToRgba } from "@/domain/colors"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type PeriodBandProps = {
  period: PeriodData & { left: number; width: number }
  /** How far the band extends above the rows container (px), to cover the milestone strip. */
  extendUp: number
  onDoubleClick: () => void
}

/**
 * Translucent vertical band drawn IN FRONT of the tasks and milestones. It
 * sits inside the rows container and grows upwards to also cover the
 * milestone strip. The band itself ignores the pointer so the items under
 * it stay clickable. Double-clicking empty space inside the band is resolved
 * by TimelineApp (by position); the handle at its base adds a tooltip.
 */
export function PeriodBand({ period, extendUp, onDoubleClick }: PeriodBandProps) {
  const dateRange = `${format(parseISO(period.startDate), "dd/MM/yyyy", { locale: ptBR })} - ${format(parseISO(period.endDate), "dd/MM/yyyy", { locale: ptBR })}`

  return (
    <div
      className="absolute z-40 pointer-events-none"
      style={{
        top: `-${extendUp}px`,
        bottom: 0,
        left: `${period.left}%`,
        width: `${period.width}%`,
        backgroundColor: hexToRgba(period.color, period.opacity),
      }}
      data-testid="period-band"
    >
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="absolute left-0 right-0 bottom-0.5 flex items-center justify-center gap-1 px-1 text-[11px] font-medium leading-4 text-foreground/70 pointer-events-auto cursor-pointer select-none"
              onDoubleClick={onDoubleClick}
              data-keep-selection
              data-testid="period-handle"
            >
              {period.name
                ? <span className="truncate">{period.name}</span>
                : <RectangleVertical className="h-3 w-3 opacity-60" aria-label="Período" />}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {period.name && <p className="font-bold">{period.name}</p>}
            <p>{dateRange}</p>
            <p className="text-muted-foreground">Duplo clique na faixa para editar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
