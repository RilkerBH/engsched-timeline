"use client"

import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useRef, useState } from "react"
import { useDraggable } from "@dnd-kit/core"
import type { PeriodData } from "@/domain/types"
import { hexToRgba } from "@/domain/colors"
import { LABEL_LAYOUT } from "@/domain/label-layout"
import { lineHeightFor } from "@/domain/typography"
import { PERIOD_INSET } from "@/domain/validation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type PeriodBandProps = {
  period: PeriodData & { left: number; width: number }
  /** How far the band extends above the rows container (px), to cover the milestone strip. */
  extendUp: number
  /** Full height (px) available to the band: milestone strip + task area. */
  fullHeight: number
  /** Font size (px) of the legend. */
  legendFontSize: number
  onDoubleClick: () => void
  /** Called once when a drag of the top or bottom edge ends. */
  onInsetsChange?: (insets: { topInset: number; bottomInset: number }) => void
}

type Edge = "top" | "bottom"

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
 * dragged anywhere. Its top and bottom edges can be pulled in (topInset /
 * bottomInset) by dragging the handles that show up on hover.
 */
export function PeriodBand({ period, extendUp, fullHeight, legendFontSize, onDoubleClick, onInsetsChange }: PeriodBandProps) {
  const edgeDrag = useRef<{ edge: Edge; y: number; top: number; bottom: number } | null>(null)
  /** Live insets while an edge is being dragged; null otherwise. */
  const [draggedInsets, setDraggedInsets] = useState<{ top: number; bottom: number } | null>(null)

  // Never let the band collapse, whatever the stored insets and the current content height
  const maxInsets = Math.max(0, fullHeight - PERIOD_INSET.minHeight)
  const storedTop = Math.min(period.topInset ?? 0, maxInsets)
  const storedBottom = Math.min(period.bottomInset ?? 0, maxInsets - storedTop)
  const topInset = draggedInsets?.top ?? storedTop
  const bottomInset = draggedInsets?.bottom ?? storedBottom

  const insetsAfter = (e: React.PointerEvent): { top: number; bottom: number } | null => {
    const d = edgeDrag.current
    if (!d) return null
    const dy = Math.round(e.clientY - d.y)
    if (d.edge === "top") return { top: Math.min(maxInsets - d.bottom, Math.max(0, d.top + dy)), bottom: d.bottom }
    return { top: d.top, bottom: Math.min(maxInsets - d.top, Math.max(0, d.bottom - dy)) }
  }

  const edgeHandle = (edge: Edge) => onInsetsChange && (
    <div
      className={`absolute inset-x-2 z-10 flex h-2 cursor-row-resize pointer-events-auto transition-opacity ${edge === "top" ? "top-0 items-start" : "bottom-0 items-end"} ${draggedInsets ? "opacity-100" : "opacity-0 hover:opacity-100"}`}
      title={edge === "top" ? "Arraste para ajustar o topo do período" : "Arraste para ajustar a base do período"}
      data-keep-selection
      onPointerDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
        e.currentTarget.setPointerCapture(e.pointerId)
        edgeDrag.current = { edge, y: e.clientY, top: topInset, bottom: bottomInset }
        setDraggedInsets({ top: topInset, bottom: bottomInset })
      }}
      onPointerMove={(e) => {
        const next = insetsAfter(e)
        if (next) setDraggedInsets(next)
      }}
      onPointerUp={(e) => {
        const next = insetsAfter(e)
        edgeDrag.current = null
        setDraggedInsets(null)
        if (next && (next.top !== storedTop || next.bottom !== storedBottom)) onInsetsChange({ topInset: next.top, bottomInset: next.bottom })
      }}
    >
      <div className="h-1 w-full rounded-full" style={{ backgroundColor: period.borderStyle === "none" ? period.color : period.borderColor }} />
    </div>
  )

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
        top: `${topInset - extendUp}px`,
        bottom: `${bottomInset}px`,
        left: `${period.left}%`,
        width: `${period.width}%`,
        backgroundColor: hexToRgba(period.color, period.opacity),
        ...borderProps,
      }}
      data-testid="period-band"
    >
      {edgeHandle("top")}
      {edgeHandle("bottom")}
      {period.name && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                ref={legendDraggable.setNodeRef}
                {...legendDraggable.listeners}
                {...legendDraggable.attributes}
                className="absolute whitespace-nowrap rounded-2xl px-2 py-1 font-medium text-foreground shadow-sm pointer-events-auto cursor-grab active:cursor-grabbing select-none"
                style={{
                  left: LABEL_LAYOUT.period.insetX,
                  bottom: LABEL_LAYOUT.period.insetY,
                  backgroundColor: hexToRgba(period.color, period.opacity),
                  ...borderProps,
                  fontSize: legendFontSize,
                  lineHeight: `${Math.max(16, lineHeightFor(legendFontSize))}px`,
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
