"use client"

import { useRef, useState } from "react"
import type { MilestoneData } from "@/domain/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useDraggable } from "@dnd-kit/core"
import { LABEL_LAYOUT } from "@/domain/label-layout"
import { type MilestoneShapeGeometry, getMilestoneShapeGeometry } from "@/domain/milestone-shape"
import { lineHeightFor, scaledFontSize } from "@/domain/typography"
import { MILESTONE_STEM_HEIGHT } from "@/domain/validation"

/** Pointer travel (px) before a press on the shape counts as a drag instead of a click. */
const DRAG_THRESHOLD = 3
const clampStem = (h: number) => Math.round(Math.min(MILESTONE_STEM_HEIGHT.max, Math.max(MILESTONE_STEM_HEIGHT.min, h)))

type MilestoneMarkerProps = {
  milestone: MilestoneData & { position: number };
  onDoubleClick: () => void;
  selected?: boolean;
  onSelect?: (event: React.MouseEvent) => void;
  /** Role font sizes (px) of the name and date, before the milestone's own fontScale. */
  fontSizes: { name: number; date: number };
  /** Called once when a vertical drag of the shape ends, with the new stem height. */
  onStemHeightChange?: (stemHeight: number) => void;
}

export function MilestoneMarker({ milestone, onDoubleClick, selected = false, onSelect, fontSizes, onStemHeightChange }: MilestoneMarkerProps) {
  const stemDrag = useRef<{ y: number; stem: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)
  /** Live stem height while the shape is being dragged; null otherwise. */
  const [draggedStem, setDraggedStem] = useState<number | null>(null)

  const nameDraggable = useDraggable({
    id: `name-milestone-${milestone.id}`,
    data: {
      type: 'name-milestone',
      id: milestone.id,
      initialCoordinates: { x: milestone.labelOffsetX, y: milestone.labelOffsetY }
    }
  });
  
  const dateDraggable = useDraggable({
    id: `date-milestone-${milestone.id}`,
    data: {
      type: 'date-milestone',
      id: milestone.id,
      initialCoordinates: { x: milestone.dateLabelOffsetX, y: milestone.dateLabelOffsetY }
    }
  });

  const displayFormat = milestone.dateFormat === 'MMM/yy' ? 'MMM/yy' : 'dd/MM/yyyy';
  const formattedDate = format(parseISO(milestone.date), displayFormat, { locale: ptBR });
  const tooltipDate = format(parseISO(milestone.date), 'dd/MM/yyyy', { locale: ptBR });

  const { nameAboveMarker, dateAboveMarker, stemWidth } = LABEL_LAYOUT.milestone;
  const nameFontSize = scaledFontSize(fontSizes.name, milestone.fontScale);
  const dateFontSize = scaledFontSize(fontSizes.date, milestone.fontScale);
  const dateLineHeight = lineHeightFor(dateFontSize);
  // The name sits above the date: keep the same gap between them whatever the date's size
  const nameAbove = nameAboveMarker + dateLineHeight - lineHeightFor(12);
  const shape = getMilestoneShapeGeometry(milestone.shape, milestone.height);
  const stemHeight = draggedStem ?? Math.max(0, milestone.stemHeight ?? 0);
  const stemColor = milestone.stemColor || milestone.color;
  const shapeStroke = selected
    ? { stroke: 'hsl(var(--primary))', strokeWidth: 3, strokeLinejoin: 'round' as const }
    : { stroke: 'none', strokeWidth: 0 };

  const nameDndTransform = nameDraggable.transform ? ` translate3d(${nameDraggable.transform.x}px, ${nameDraggable.transform.y}px, 0)` : '';
  const nameLabelStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: `calc(100% + ${nameAbove}px)`,
    fontSize: nameFontSize,
    lineHeight: `${lineHeightFor(nameFontSize)}px`,
    left: 0,
    transform: `translate(calc(-50% + ${milestone.labelOffsetX || 0}px), ${milestone.labelOffsetY || 0}px) ${nameDndTransform}`,
    whiteSpace: milestone.preventNameLineBreak ? 'nowrap' : 'pre-wrap',
    minWidth: '100px',
    zIndex: nameDraggable.transform ? 1000 : undefined,
    textAlign: 'center',
  };

  const dateDndTransform = dateDraggable.transform ? ` translate3d(${dateDraggable.transform.x}px, ${dateDraggable.transform.y}px, 0)` : '';
  const dateLabelStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: `calc(100% + ${dateAboveMarker}px)`,
    fontSize: dateFontSize,
    lineHeight: `${dateLineHeight}px`,
    left: 0,
    transform: `translate(calc(-50% + ${milestone.dateLabelOffsetX || 0}px), ${milestone.dateLabelOffsetY || 0}px) ${dateDndTransform}`,
    whiteSpace: 'nowrap',
    zIndex: dateDraggable.transform ? 1000 : undefined,
    textAlign: 'center',
  };


  // Pressing the shape and moving it up/down stretches the stem (its top end); a press without movement is a click
  const stemAfter = (clientY: number) => stemDrag.current ? clampStem(stemDrag.current.stem + stemDrag.current.y - clientY) : 0
  const stemDragHandlers = onStemHeightChange ? {
    onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => {
      if (e.button !== 0) return
      e.currentTarget.setPointerCapture(e.pointerId)
      stemDrag.current = { y: e.clientY, stem: stemHeight, moved: false }
    },
    onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => {
      const d = stemDrag.current
      if (!d) return
      if (!d.moved && Math.abs(e.clientY - d.y) < DRAG_THRESHOLD) return
      d.moved = true
      setDraggedStem(stemAfter(e.clientY))
    },
    onPointerUp: (e: React.PointerEvent<SVGSVGElement>) => {
      const next = stemAfter(e.clientY)
      const moved = stemDrag.current?.moved
      stemDrag.current = null
      if (!moved) return
      suppressClick.current = true
      setDraggedStem(null)
      if (next !== (milestone.stemHeight ?? 0)) onStemHeightChange(next)
    },
  } : {}

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Zero-width box standing on the axis at the milestone's date: stem below, shape on top, labels above */}
          <div
            className="absolute bottom-0 z-30"
            style={{ left: `${milestone.position}%`, width: 0, height: `${stemHeight + shape.height}px` }}
            onDoubleClick={onDoubleClick}
            data-keep-selection
          >
            {stemHeight > 0 && (
              <div
                className="absolute bottom-0"
                style={{ left: -stemWidth / 2, width: stemWidth, height: stemHeight, backgroundColor: stemColor }}
              />
            )}
            <svg
              className="absolute top-0 transition-transform duration-150 hover:scale-110"
              width={shape.width}
              height={shape.height}
              viewBox={`0 0 ${shape.width} ${shape.height}`}
              style={{ left: -shape.anchorX, overflow: 'visible', cursor: onStemHeightChange ? 'ns-resize' : 'pointer', transformOrigin: `${shape.anchorX}px 100%`, touchAction: 'none' }}
              onClick={(e) => {
                if (suppressClick.current) {
                  suppressClick.current = false
                  return
                }
                onSelect?.(e)
              }}
              {...stemDragHandlers}
            >
              <MilestoneShapeElement geometry={shape} fill={milestone.color} {...shapeStroke} />
            </svg>
            <div 
              ref={nameDraggable.setNodeRef}
              {...nameDraggable.listeners}
              {...nameDraggable.attributes}
              className="text-center text-foreground/80 font-semibold cursor-grab active:cursor-grabbing"
              style={nameLabelStyle}
            >
              {milestone.name}
            </div>
             <div 
              ref={dateDraggable.setNodeRef}
              {...dateDraggable.listeners}
              {...dateDraggable.attributes}
              className="text-center text-foreground/60 cursor-grab active:cursor-grabbing"
              style={dateLabelStyle}
            >
              {formattedDate}
            </div>
            {draggedStem !== null && (
              <div
                className="absolute top-0 whitespace-nowrap rounded bg-foreground/80 px-1 text-[10px] leading-4 text-background"
                style={{ left: shape.width - shape.anchorX + 4 }}
              >
                Linha: {draggedStem}px
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="font-bold">{milestone.name}</p>
          <p>{tooltipDate}</p>
          {onStemHeightChange && <p className="text-muted-foreground">Arraste o símbolo para cima/baixo para ajustar a linha</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/** The SVG element of a milestone shape (polygon, circle or rect), drawn in the geometry's own box. */
export function MilestoneShapeElement({ geometry, ...paint }: { geometry: MilestoneShapeGeometry } & React.SVGProps<SVGElement>) {
  const el = geometry.element
  const props = paint as React.SVGProps<any>
  if (el.tag === 'circle') return <circle cx={el.cx} cy={el.cy} r={el.r} {...props} />
  if (el.tag === 'rect') return <rect x={el.x} y={el.y} width={el.width} height={el.height} rx={el.rx} {...props} />
  return <polygon points={el.points} {...props} />
}
