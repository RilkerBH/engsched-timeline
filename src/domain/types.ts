export interface ProjectSettings {
  id: string;
  title: string;
  startDate: string;   // YYYY-MM-DD (UTC)
  endDate: string;     // YYYY-MM-DD (UTC)
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
}

export interface MilestoneData {
  id: string;
  name: string;
  date: string;        // YYYY-MM-DD (UTC)
  color: string;
  height: number;      // 20‒60 px
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
}

export interface ProjectFile {
  version: string;
  exportedAt: string;
  projectSettings: ProjectSettings | null;
  tasks: TaskData[];
  milestones: MilestoneData[];
  periods: PeriodData[];
}
