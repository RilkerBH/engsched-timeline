"use client"

import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
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
 * Translucent vertical band drawn behind the tasks. It sits inside the rows
 * container and grows upwards to also cover the milestone strip.
 */
export function PeriodBand({ period, extendUp, onDoubleClick }: PeriodBandProps) {
  const dateRange = `${format(parseISO(period.startDate), "dd/MM/yyyy", { locale: ptBR })} - ${format(parseISO(period.endDate), "dd/MM/yyyy", { locale: ptBR })}`

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="absolute z-0 cursor-pointer"
            style={{
              top: `-${extendUp}px`,
              bottom: 0,
              left: `${period.left}%`,
              width: `${period.width}%`,
              backgroundColor: hexToRgba(period.color, period.opacity),
            }}
            onDoubleClick={onDoubleClick}
            data-keep-selection
            data-testid="period-band"
          >
            {period.name && (
              <div
                className="absolute left-0 right-0 bottom-0.5 px-1 text-center text-[11px] font-medium leading-4 text-foreground/70 truncate"
                title={period.name}
              >
                {period.name}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {period.name && <p className="font-bold">{period.name}</p>}
          <p>{dateRange}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
