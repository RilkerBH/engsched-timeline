"use client"

import type { ProjectSettings, MilestoneData } from "@/domain/types"
import { getMonthHeaders, getMilestonePosition } from "@/domain/layout"
import { MilestoneMarker } from "./milestone-marker"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"

type TimelineHeaderProps = {
  projectSettings: ProjectSettings
  milestones: MilestoneData[]
  handleEditMilestone: (milestone: MilestoneData) => void;
  selectedMilestoneIds?: string[];
  onSelectMilestone?: (id: string, event: React.MouseEvent) => void;
}

export function TimelineHeader({ projectSettings, milestones, handleEditMilestone, selectedMilestoneIds = [], onSelectMilestone }: TimelineHeaderProps) {
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
      <div className="relative h-20 border-b-2 border-slate-200">
         {milestonesWithPositions.map((milestone) => (
          <MilestoneMarker 
            key={milestone.id} 
            milestone={milestone}
            onDoubleClick={() => handleEditMilestone(milestone)}
            selected={selectedMilestoneIds.includes(milestone.id)}
            onSelect={(e) => onSelectMilestone?.(milestone.id, e)}
          />
        ))}
      </div>
    </div>
  )
}
