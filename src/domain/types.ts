export interface ProjectSettings {
  id: string;
  title: string;
  startDate: string;   // YYYY-MM-DD (UTC)
  endDate: string;     // YYYY-MM-DD (UTC)
}

export interface TaskData {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
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
