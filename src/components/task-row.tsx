"use client"

import type { TaskData } from "@/domain/types"
import { useDraggable } from "@dnd-kit/core"
import { ArrowDown, ArrowUp } from "lucide-react"
import { Button } from "./ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { LABEL_LAYOUT } from "@/domain/label-layout"

type TaskRowProps = {
  task: TaskData & { left: number; width: number; top: number; }
  onDoubleClick: () => void
  onOrderChange: (direction: 'up' | 'down') => void
  selected?: boolean
  onSelect?: (event: React.MouseEvent) => void
}

export function TaskRow({ task, onDoubleClick, onOrderChange, selected = false, onSelect }: TaskRowProps) {
  const nameDraggable = useDraggable({
    id: `name-task-${task.id}`,
    data: {
      type: 'name-task',
      id: task.id,
      initialCoordinates: { x: task.labelOffsetX, y: task.labelOffsetY }
    }
  });
  
  const dateDraggable = useDraggable({
    id: `date-task-${task.id}`,
    data: {
      type: 'date-task',
      id: task.id,
      initialCoordinates: { x: task.dateLabelOffsetX, y: task.dateLabelOffsetY }
    }
  });

  const displayFormat = task.dateFormat === 'MMM/yy' ? 'MMM/yy' : 'dd/MM/yyyy';
  const formattedStartDate = format(parseISO(task.startDate), displayFormat, { locale: ptBR });
  const formattedEndDate = format(parseISO(task.endDate), displayFormat, { locale: ptBR });
  const formattedDateRange = `${formattedStartDate} - ${formattedEndDate}`;

  const tooltipStartDate = format(parseISO(task.startDate), 'dd/MM/yyyy', { locale: ptBR });
  const tooltipEndDate = format(parseISO(task.endDate), 'dd/MM/yyyy', { locale: ptBR });
  const tooltipDateRange = `${tooltipStartDate} - ${tooltipEndDate}`;


  const nameDndTransform = nameDraggable.transform ? ` translate3d(${nameDraggable.transform.x}px, ${nameDraggable.transform.y}px, 0)` : '';
  const nameLabelStyle: React.CSSProperties = {
    position: 'absolute',
    whiteSpace: task.preventNameLineBreak ? 'nowrap' : 'pre-wrap',
    zIndex: nameDraggable.transform ? 1000 : undefined,
  };

  const dateDndTransform = dateDraggable.transform ? ` translate3d(${dateDraggable.transform.x}px, ${dateDraggable.transform.y}px, 0)` : '';
  const dateLabelStyle: React.CSSProperties = {
    position: 'absolute',
    whiteSpace: 'nowrap',
    width: 'max-content',
    zIndex: dateDraggable.transform ? 1000 : undefined,
  };

  const offX = task.labelOffsetX || 0;
  const offY = task.labelOffsetY || 0;
  const dOffX = task.dateLabelOffsetX || 0;
  const dOffY = task.dateLabelOffsetY || 0;

  if (task.showTextInside) {
    const { dateBelowBar } = LABEL_LAYOUT.task.inside;
    // Name centered inside the bar
    nameLabelStyle.top = `50%`;
    nameLabelStyle.left = `50%`;
    nameLabelStyle.transform = `translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px)) ${nameDndTransform}`;
    nameLabelStyle.textAlign = 'center';
    nameLabelStyle.width = `calc(100% - 16px)`;

    // Date centered right below the bar
    dateLabelStyle.top = `calc(100% + ${dateBelowBar + dOffY}px)`;
    dateLabelStyle.left = `calc(50% + ${dOffX}px)`;
    dateLabelStyle.transform = `translateX(-50%) ${dateDndTransform}`;
    dateLabelStyle.textAlign = 'center';
  } else {
    const { gapX, nameAboveCenter, dateBelowCenter } = LABEL_LAYOUT.task.outside;
    // Name to the right of the bar, text baseline just above the vertical center
    nameLabelStyle.top = `50%`;
    nameLabelStyle.left = `calc(100% + ${gapX + offX}px)`;
    nameLabelStyle.transform = `translateY(calc(-100% + ${offY - nameAboveCenter}px)) ${nameDndTransform}`;
    nameLabelStyle.textAlign = 'left';
    nameLabelStyle.width = 'max-content';

    // Date to the right of the bar, aligned with the name, just below the vertical center
    dateLabelStyle.top = `50%`;
    dateLabelStyle.left = `calc(100% + ${gapX + dOffX}px)`;
    dateLabelStyle.transform = `translateY(${dateBelowCenter + dOffY}px) ${dateDndTransform}`;
    dateLabelStyle.textAlign = 'left';
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: `${task.top}px`,
        left: `${task.left}%`,
        width: `${task.width}%`,
        height: `${task.height}px`,
      }}
      className="group z-20"
      data-keep-selection
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "h-full w-full rounded-md shadow-md transition-all duration-150 flex items-center justify-center overflow-hidden cursor-pointer",
                selected && "ring-2 ring-offset-2 ring-primary"
              )}
              style={{ backgroundColor: task.color }}
              onClick={(e) => onSelect?.(e)}
              onDoubleClick={onDoubleClick}
            >
              <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-0.5 z-10">
                <Button variant="ghost" size="icon" className="h-5 w-5 bg-black/20 hover:bg-black/40 text-white" onClick={(e) => {e.stopPropagation(); onOrderChange('up')}}>
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-5 w-5 bg-black/20 hover:bg-black/40 text-white" onClick={(e) => {e.stopPropagation(); onOrderChange('down')}}>
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-bold">{task.name}</p>
            <p>{tooltipDateRange}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div 
        ref={nameDraggable.setNodeRef}
        {...nameDraggable.listeners}
        {...nameDraggable.attributes}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onDoubleClick();
        }}
        className={cn(
          "text-xs font-medium leading-4 cursor-grab active:cursor-grabbing",
          task.showTextInside ? "text-white" : "text-foreground"
        )}
        style={nameLabelStyle}
      >
        {task.name}
      </div>

      <div
        ref={dateDraggable.setNodeRef}
        {...dateDraggable.listeners}
        {...dateDraggable.attributes}
        className="text-xs leading-4 text-foreground/60 cursor-grab active:cursor-grabbing"
        style={dateLabelStyle}
      >
        {formattedDateRange}
      </div>
    </div>
  )
}
