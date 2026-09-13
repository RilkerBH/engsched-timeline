"use client"

import type { MilestoneData } from "@/domain/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useDraggable } from "@dnd-kit/core"
import { LABEL_LAYOUT } from "@/domain/label-layout"

type MilestoneMarkerProps = {
  milestone: MilestoneData & { position: number };
  onDoubleClick: () => void;
  selected?: boolean;
  onSelect?: (event: React.MouseEvent) => void;
}

export function MilestoneMarker({ milestone, onDoubleClick, selected = false, onSelect }: MilestoneMarkerProps) {
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

  const { nameAboveMarker, dateAboveMarker } = LABEL_LAYOUT.milestone;

  const nameDndTransform = nameDraggable.transform ? ` translate3d(${nameDraggable.transform.x}px, ${nameDraggable.transform.y}px, 0)` : '';
  const nameLabelStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: `calc(100% + ${nameAboveMarker}px)`,
    left: `50%`,
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
    left: `50%`,
    transform: `translate(calc(-50% + ${milestone.dateLabelOffsetX || 0}px), ${milestone.dateLabelOffsetY || 0}px) ${dateDndTransform}`,
    whiteSpace: 'nowrap',
    zIndex: dateDraggable.transform ? 1000 : undefined,
    textAlign: 'center',
  };


  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="absolute bottom-0 transition-all duration-150 hover:scale-110 z-30"
            style={{ left: `calc(${milestone.position}% - ${(milestone.height * 0.866) / 2}px)` }}
            onDoubleClick={onDoubleClick}
            data-keep-selection
          >
            <svg 
              width={milestone.height * 0.866} 
              height={milestone.height} 
              viewBox={`0 0 ${milestone.height * 0.866} ${milestone.height}`}
              style={{ display: 'block', overflow: 'visible', cursor: 'pointer' }}
              onClick={(e) => onSelect?.(e)}
            >
              <polygon 
                points={`${(milestone.height * 0.866) / 2},0 0,${milestone.height} ${milestone.height * 0.866},${milestone.height}`}
                fill={milestone.color}
                stroke={selected ? 'hsl(var(--primary))' : 'none'}
                strokeWidth={selected ? 3 : 0}
                strokeLinejoin="round"
              />
            </svg>
            <div 
              ref={nameDraggable.setNodeRef}
              {...nameDraggable.listeners}
              {...nameDraggable.attributes}
              className="text-xs leading-4 text-center text-foreground/80 font-semibold cursor-grab active:cursor-grabbing"
              style={nameLabelStyle}
            >
              {milestone.name}
            </div>
             <div 
              ref={dateDraggable.setNodeRef}
              {...dateDraggable.listeners}
              {...dateDraggable.attributes}
              className="text-xs leading-4 text-center text-foreground/60 cursor-grab active:cursor-grabbing"
              style={dateLabelStyle}
            >
              {formattedDate}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="font-bold">{milestone.name}</p>
          <p>{tooltipDate}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
