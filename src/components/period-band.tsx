"use client"

import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useDraggable } from "@dnd-kit/core"
import type { PeriodData } from "@/domain/types"
import { hexToRgba } from "@/domain/colors"
import { LABEL_LAYOUT } from "@/domain/label-layout"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type PeriodBandProps = {
  period: PeriodData & { left: number; width: number }
  /** How far the band extends above the rows container (px), to cover the milestone strip. */
  extendUp: number
  onDoubleClick: () => void
}

/**
 * Translucent, rounded vertical band drawn IN FRONT of the tasks and
 * milestones, with an optional dashed/dotted/solid border in a customizable
 * color. It sits inside the rows container and grows upwards to also cover
 * the milestone strip. The band itself ignores the pointer so the items
 * under it stay clickable. Double-clicking empty space inside the band is
 * resolved by TimelineApp (by position). A named period gets a small,
 * independently draggable legend styled just like the band itself (same
 * fill and border), defaulting to the band's own bottom-left corner —
 * always inside the visible band regardless of content height — that can be
 * dragged anywhere.
 */
export function PeriodBand({ period, extendUp, onDoubleClick }: PeriodBandProps) {
  const dateRange = `${format(parseISO(period.startDate), "dd/MM/yyyy", { locale: ptBR })} - ${format(parseISO(period.endDate), "dd/MM/yyyy", { locale: ptBR })}`

  const legendDraggable = useDraggable({
    id: `name-period-${period.id}`,
    data: {
      type: 'name-period',
      id: period.id,
      initialCoordinates: { x: period.labelOffsetX, y: period.labelOffsetY }
    }
  })

  const legendDndTransform = legendDraggable.transform ? ` translate3d(${legendDraggable.transform.x}px, ${legendDraggable.transform.y}px, 0)` : ''
  const offX = period.labelOffsetX || 0
  const offY = period.labelOffsetY || 0

  const borderProps = {
    borderStyle: period.borderStyle,
    borderWidth: LABEL_LAYOUT.period.borderWidth,
    borderColor: period.borderColor,
  }

  return (
    <div
      className="absolute z-40 pointer-events-none rounded-2xl"
      style={{
        top: `-${extendUp}px`,
        bottom: 0,
        left: `${period.left}%`,
        width: `${period.width}%`,
        backgroundColor: hexToRgba(period.color, period.opacity),
        ...borderProps,
      }}
      data-testid="period-band"
    >
      {period.name && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                ref={legendDraggable.setNodeRef}
                {...legendDraggable.listeners}
                {...legendDraggable.attributes}
                className="absolute whitespace-nowrap rounded-2xl px-2 py-1 text-[11px] font-medium leading-4 text-foreground shadow-sm pointer-events-auto cursor-grab active:cursor-grabbing select-none"
                style={{
                  left: LABEL_LAYOUT.period.insetX,
                  bottom: LABEL_LAYOUT.period.insetY,
                  backgroundColor: hexToRgba(period.color, period.opacity),
                  ...borderProps,
                  transform: `translate3d(${offX}px, ${offY}px, 0)${legendDndTransform}`,
                  zIndex: legendDraggable.transform ? 1000 : undefined,
                }}
                onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick() }}
                data-keep-selection
                data-testid="period-handle"
              >
                {period.name}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="font-bold">{period.name}</p>
              <p>{dateRange}</p>
              <p className="text-muted-foreground">Duplo clique na faixa para editar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
