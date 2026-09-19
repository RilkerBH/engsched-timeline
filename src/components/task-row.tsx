"use client"

import type { TaskData } from "@/domain/types"
import type { TaskBar } from "@/domain/layout"
import { useDraggable } from "@dnd-kit/core"
import { ArrowDown, ArrowUp } from "lucide-react"
import { Button } from "./ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { LABEL_LAYOUT } from "@/domain/label-layout"

type TaskRowProps = {
  task: TaskData & { left: number; width: number; top: number; bars: TaskBar[]; }
  onDoubleClick: () => void
  onOrderChange: (direction: 'up' | 'down') => void
  selected?: boolean
  onSelect?: (event: React.MouseEvent) => void
}

export function TaskRow({ task, onDoubleClick, onOrderChange, selected = false, onSelect }: TaskRowProps) {
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
      <div
        className="relative h-full w-full cursor-pointer"
        onClick={(e) => onSelect?.(e)}
        onDoubleClick={onDoubleClick}
      >
        <TooltipProvider>
          {task.bars.map(bar => (
            <TaskBarSegment
              key={bar.intervalId ?? 'primary'}
              taskId={task.id}
              bar={bar}
              color={task.color}
              showTextInside={task.showTextInside}
              preventNameLineBreak={task.preventNameLineBreak}
              dateFormat={task.dateFormat}
              selected={selected}
              onDoubleClick={onDoubleClick}
            />
          ))}
        </TooltipProvider>

        <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-0.5 z-10">
          <Button variant="ghost" size="icon" className="h-5 w-5 bg-black/20 hover:bg-black/40 text-white" onClick={(e) => {e.stopPropagation(); onOrderChange('up')}}>
            <ArrowUp className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-5 w-5 bg-black/20 hover:bg-black/40 text-white" onClick={(e) => {e.stopPropagation(); onOrderChange('down')}}>
            <ArrowDown className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

type TaskBarSegmentProps = {
  taskId: string
  bar: TaskBar
  color: string
  showTextInside: boolean
  preventNameLineBreak?: boolean
  dateFormat?: 'dd/MM/yyyy' | 'MMM/yy'
  selected: boolean
  onDoubleClick: () => void
}

/**
 * One bar of a (possibly split) task: its own colored segment, tooltip, and
 * independently draggable name/date labels, anchored to this bar's own
 * position inside the row (not the task's overall bounding box).
 */
function TaskBarSegment({ taskId, bar, color, showTextInside, preventNameLineBreak, dateFormat, selected, onDoubleClick }: TaskBarSegmentProps) {
  const suffix = bar.intervalId ?? 'primary';
  const nameDraggable = useDraggable({
    id: `name-task-${taskId}-${suffix}`,
    data: {
      type: 'name-task',
      id: taskId,
      intervalId: bar.intervalId,
      initialCoordinates: { x: bar.labelOffsetX, y: bar.labelOffsetY }
    }
  });

  const dateDraggable = useDraggable({
    id: `date-task-${taskId}-${suffix}`,
    data: {
      type: 'date-task',
      id: taskId,
      intervalId: bar.intervalId,
      initialCoordinates: { x: bar.dateLabelOffsetX, y: bar.dateLabelOffsetY }
    }
  });

  const displayFormat = dateFormat === 'MMM/yy' ? 'MMM/yy' : 'dd/MM/yyyy';
  const formattedDateRange = `${format(parseISO(bar.startDate), displayFormat, { locale: ptBR })} - ${format(parseISO(bar.endDate), displayFormat, { locale: ptBR })}`;
  const tooltipDateRange = `${format(parseISO(bar.startDate), 'dd/MM/yyyy', { locale: ptBR })} - ${format(parseISO(bar.endDate), 'dd/MM/yyyy', { locale: ptBR })}`;

  const nameDndTransform = nameDraggable.transform ? ` translate3d(${nameDraggable.transform.x}px, ${nameDraggable.transform.y}px, 0)` : '';
  const nameLabelStyle: React.CSSProperties = {
    position: 'absolute',
    whiteSpace: preventNameLineBreak ? 'nowrap' : 'pre-wrap',
    zIndex: nameDraggable.transform ? 1000 : undefined,
  };

  const dateDndTransform = dateDraggable.transform ? ` translate3d(${dateDraggable.transform.x}px, ${dateDraggable.transform.y}px, 0)` : '';
  const dateLabelStyle: React.CSSProperties = {
    position: 'absolute',
    whiteSpace: 'nowrap',
    width: 'max-content',
    zIndex: dateDraggable.transform ? 1000 : undefined,
  };

  const offX = bar.labelOffsetX || 0;
  const offY = bar.labelOffsetY || 0;
  const dOffX = bar.dateLabelOffsetX || 0;
  const dOffY = bar.dateLabelOffsetY || 0;
  const barCenter = bar.left + bar.width / 2;
  const barEnd = bar.left + bar.width;

  if (showTextInside) {
    const { dateBelowBar } = LABEL_LAYOUT.task.inside;
    // Name centered inside this bar
    nameLabelStyle.top = `50%`;
    nameLabelStyle.left = `${barCenter}%`;
    nameLabelStyle.transform = `translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px)) ${nameDndTransform}`;
    nameLabelStyle.textAlign = 'center';
    nameLabelStyle.width = `calc(${bar.width}% - 16px)`;

    // Date centered right below this bar
    dateLabelStyle.top = `calc(100% + ${dateBelowBar + dOffY}px)`;
    dateLabelStyle.left = `calc(${barCenter}% + ${dOffX}px)`;
    dateLabelStyle.transform = `translateX(-50%) ${dateDndTransform}`;
    dateLabelStyle.textAlign = 'center';
  } else {
    const { gapX, nameAboveCenter, dateBelowCenter } = LABEL_LAYOUT.task.outside;
    // Name to the right of this bar, text baseline just above the vertical center
    nameLabelStyle.top = `50%`;
    nameLabelStyle.left = `calc(${barEnd}% + ${gapX + offX}px)`;
    nameLabelStyle.transform = `translateY(calc(-100% + ${offY - nameAboveCenter}px)) ${nameDndTransform}`;
    nameLabelStyle.textAlign = 'left';
    nameLabelStyle.width = 'max-content';

    // Date to the right of this bar, aligned with the name, just below the vertical center
    dateLabelStyle.top = `50%`;
    dateLabelStyle.left = `calc(${barEnd}% + ${gapX + dOffX}px)`;
    dateLabelStyle.transform = `translateY(${dateBelowCenter + dOffY}px) ${dateDndTransform}`;
    dateLabelStyle.textAlign = 'left';
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "absolute top-0 h-full rounded-md shadow-md transition-all duration-150 overflow-hidden",
              selected && "ring-2 ring-offset-2 ring-primary"
            )}
            style={{ backgroundColor: color, left: `${bar.left}%`, width: `${bar.width}%` }}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-bold">{bar.name}</p>
          <p>{tooltipDateRange}</p>
        </TooltipContent>
      </Tooltip>

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
          showTextInside ? "text-white" : "text-foreground"
        )}
        style={nameLabelStyle}
      >
        {bar.name}
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
    </>
  )
}
