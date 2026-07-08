declare module 'frappe-gantt' {
  export interface GanttTask {
    id: string;
    name: string;
    start: string;
    end: string;
    progress?: number;
    dependencies?: string;
    custom_class?: string;
  }

  export interface GanttOptions {
    view_mode?: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month';
    language?: string;
    on_date_change?: (task: GanttTask, start: Date, end: Date) => void;
    on_click?: (task: GanttTask) => void;
    custom_popup_html?: (task: GanttTask) => string;
  }

  export default class Gantt {
    constructor(element: HTMLElement | SVGElement, tasks: GanttTask[], options?: GanttOptions);
    refresh(tasks: GanttTask[]): void;
    change_view_mode(mode: GanttOptions['view_mode']): void;
  }
}
