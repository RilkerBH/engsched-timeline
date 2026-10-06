"use client"

import { useRef, useState } from "react"
import type { ProjectSettings, MilestoneData } from "@/domain/types"
import { MILESTONE_STRIP_HEIGHT } from "@/domain/validation"
import { getMonthHeaders, getMilestonePosition } from "@/domain/layout"
import { MilestoneMarker } from "./milestone-marker"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"

type TimelineHeaderProps = {
  projectSettings: ProjectSettings
  milestones: MilestoneData[]
  handleEditMilestone: (milestone: MilestoneData) => void;
  selectedMilestoneIds?: string[];
  onSelectMilestone?: (id: string, event: React.MouseEvent) => void;
  /** Height (px) of the milestone strip. */
  stripHeight: number;
  /** Called while dragging the strip's bottom edge (live preview) and once more when the drag ends (commit = true). */
  onStripHeightChange?: (height: number, commit: boolean) => void;
}

const clampStrip = (h: number) => Math.round(Math.min(MILESTONE_STRIP_HEIGHT.max, Math.max(MILESTONE_STRIP_HEIGHT.min, h)))

export function TimelineHeader({ projectSettings, milestones, handleEditMilestone, selectedMilestoneIds = [], onSelectMilestone, stripHeight, onStripHeightChange }: TimelineHeaderProps) {
  const resizeStart = useRef<{ y: number; height: number } | null>(null)
  const [resizing, setResizing] = useState(false)

  const monthHeaders = getMonthHeaders(projectSettings.startDate, projectSettings.endDate)
  const milestonesWithPositions = milestones.map(m => ({
    ...m,
    position: getMilestonePosition(m.date, projectSettings.startDate, projectSettings.endDate)
  }))

  return (
    <div className="relative z-10 select-none">
      <div className="relative flex h-10 bg-gradient-to-r from-slate-500 to-slate-800 rounded-t-lg">
        {monthHeaders.map((month, index) => (
          <TooltipProvider key={index} delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="flex-shrink-0 h-full flex items-center justify-center border-r border-slate-400/30 last:border-r-0"
                  style={{ width: `${month.width}%` }}
                >
                  <span className="text-xs font-semibold text-white tracking-wider">
                    {month.name}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{month.name.replace('/', ' de ')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
      <div className="relative border-b-2 border-slate-200" style={{ height: `${stripHeight}px` }}>
         {milestonesWithPositions.map((milestone) => (
          <MilestoneMarker 
            key={milestone.id} 
            milestone={milestone}
            onDoubleClick={() => handleEditMilestone(milestone)}
            selected={selectedMilestoneIds.includes(milestone.id)}
            onSelect={(e) => onSelectMilestone?.(milestone.id, e)}
          />
        ))}
        {onStripHeightChange && (
          <div
            className={`absolute inset-x-0 bottom-0 z-20 flex h-2 cursor-row-resize items-end transition-opacity ${resizing ? "opacity-100" : "opacity-0 hover:opacity-100"}`}
            title="Arraste para ajustar a altura do espaço dos marcos"
            data-keep-selection
            onPointerDown={(e) => {
              e.preventDefault()
              e.currentTarget.setPointerCapture(e.pointerId)
              resizeStart.current = { y: e.clientY, height: stripHeight }
              setResizing(true)
            }}
            onPointerMove={(e) => {
              if (!resizeStart.current) return
              onStripHeightChange(clampStrip(resizeStart.current.height + e.clientY - resizeStart.current.y), false)
            }}
            onPointerUp={(e) => {
              if (!resizeStart.current) return
              onStripHeightChange(clampStrip(resizeStart.current.height + e.clientY - resizeStart.current.y), true)
              resizeStart.current = null
              setResizing(false)
            }}
          >
            <div className="h-1 w-full rounded-full bg-primary/60" />
          </div>
        )}
      </div>
    </div>
  )
}
