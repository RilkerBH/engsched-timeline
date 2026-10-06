export interface ProjectSettings {
  id: string;
  title: string;
  startDate: string;   // YYYY-MM-DD (UTC)
  endDate: string;     // YYYY-MM-DD (UTC)
  /** Height (px) of the milestone strip between the month bar and the tasks. Absent = default. */
  milestoneStripHeight?: number;
}

export interface TaskInterval {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD (UTC)
  endDate: string;   // YYYY-MM-DD (UTC)
  labelOffsetX: number;
  labelOffsetY: number;
  dateLabelOffsetX: number;
  dateLabelOffsetY: number;
}

export interface TaskData {
  id: string;
  name: string;
  startDate: string;   // envelope: min(intervals[].startDate) when intervals is set
  endDate: string;     // envelope: max(intervals[].endDate) when intervals is set
  /**
   * Extra date ranges ("intervalos") the task is split into, drawn as
   * separate bars on the same row with a gap between them (e.g. a task
   * paused during the rainy season). Present only with 2+ entries; absent
   * means the task is a single continuous bar from startDate to endDate.
   * Each interval has its own name and label offsets, independent of the
   * task's own (used below only when intervals is absent).
   */
  intervals?: TaskInterval[];
  color: string;
  height: number;      // 16‒80 px
  order: number;
  showTextInside: boolean;
  labelOffsetX: number;
  labelOffsetY: number;
  dateLabelOffsetX: number;
  dateLabelOffsetY: number;
  preventNameLineBreak?: boolean;
  dateFormat?: 'dd/MM/yyyy' | 'MMM/yy';
  /** Side of the bar the name/date sit on when the name is outside the bar. Absent = "right". */
  labelSide?: TaskLabelSide;
}

export type TaskLabelSide = 'right' | 'left';

export type MilestoneShape = 'triangle' | 'triangle-down' | 'flag' | 'diamond' | 'circle' | 'square' | 'star';

export interface MilestoneData {
  id: string;
  name: string;
  date: string;        // YYYY-MM-DD (UTC)
  color: string;
  height: number;      // 20‒60 px (size of the shape)
  /** Shape of the marker. Absent = "triangle". */
  shape?: MilestoneShape;
  /** Length (px) of the vertical line between the timeline axis and the shape. Absent = 0 (no line). */
  stemHeight?: number;
  /** Color of the vertical line. Absent = the milestone's own color. */
  stemColor?: string;
  labelOffsetX: number; // px
  labelOffsetY: number; // px
  dateLabelOffsetX: number;
  dateLabelOffsetY: number;
  preventNameLineBreak?: boolean;
  dateFormat?: 'dd/MM/yyyy' | 'MMM/yy';
}

/**
 * A highlighted date range drawn as a translucent vertical band over the
 * tasks and milestones (e.g. rainy season, collective holidays).
 */
export interface PeriodData {
  id: string;
  name: string;         // may be empty
  startDate: string;    // YYYY-MM-DD (UTC), inclusive
  endDate: string;      // YYYY-MM-DD (UTC), inclusive
  color: string;        // #RRGGBB
  opacity: number;      // 5‒80 (%)
  borderStyle: 'none' | 'solid' | 'dashed' | 'dotted';
  borderColor: string;  // #RRGGBB
  /** Drag offset (px) of the standalone name legend, relative to its default position. */
  labelOffsetX: number;
  labelOffsetY: number;
}

export interface ProjectFile {
  version: string;
  exportedAt: string;
  projectSettings: ProjectSettings | null;
  tasks: TaskData[];
  milestones: MilestoneData[];
  periods: PeriodData[];
}
