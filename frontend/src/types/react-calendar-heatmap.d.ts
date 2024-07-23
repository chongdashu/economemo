// src/types/react-calendar-heatmap.d.ts
declare module 'react-calendar-heatmap' {
    import * as React from 'react';
  
    export interface ReactCalendarHeatmapProps {
      startDate: Date | string;
      endDate: Date | string;
      values: Array<{
        date: Date | string;
        count: number;
      }>;
      gutterSize?: number;
      horizontal?: boolean;
      numDays?: number;
      showOutOfRangeDays?: boolean;
      titleForValue?: (value: { date: Date; count: number }) => string;
      tooltipDataAttrs?: { [key: string]: string };
      classForValue?: (value: { date: Date; count: number }) => string;
      onClick?: (value: { date: Date; count: number }) => void;
      onMouseOver?: (value: { date: Date; count: number }) => void;
      onMouseLeave?: (value: { date: Date; count: number }) => void;
      transformDayElement?: (
        rect: SVGRectElement,
        value: { date: Date; count: number },
        index: number
      ) => React.ReactNode;
    }
  
    export default class ReactCalendarHeatmap extends React.Component<
      ReactCalendarHeatmapProps,
      any
    > {}
  }
  