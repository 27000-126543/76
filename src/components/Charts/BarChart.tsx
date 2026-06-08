import {
  useRef,
  useEffect,
  type CSSProperties,
} from 'react';
import ReactECharts from 'echarts-for-react';
import { cn } from '@/lib/utils';
import type { EChartsOption } from 'echarts';

export interface BarChartSeries {
  name: string;
  data: number[];
  color?: string;
  stack?: string;
}

export interface BarChartProps {
  xAxisData: string[];
  series: BarChartSeries[];
  title?: string;
  subtitle?: string;
  height?: string | number;
  showLegend?: boolean;
  horizontal?: boolean;
  className?: string;
  style?: CSSProperties;
  yAxisName?: string;
  xAxisName?: string;
  labelFormatter?: (params: any) => string;
  onChartReady?: (instance: any) => void;
}

const defaultColors = [
  '#3B82F6',
  '#10B981',
  '#F97316',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F59E0B',
];

export function BarChart({
  xAxisData,
  series,
  title,
  subtitle,
  height = 300,
  showLegend = true,
  horizontal = false,
  className,
  style,
  yAxisName,
  xAxisName,
  labelFormatter,
  onChartReady,
}: BarChartProps) {
  const chartRef = useRef<ReactECharts>(null);

  useEffect(() => {
    if (chartRef.current && onChartReady) {
      onChartReady(chartRef.current.getEchartsInstance());
    }
  }, [onChartReady]);

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    title: title
      ? {
          text: title,
          subtext: subtitle,
          left: 0,
          top: 0,
          textStyle: {
            color: '#F1F5F9',
            fontSize: 16,
            fontWeight: 600,
          },
          subtextStyle: {
            color: '#64748B',
            fontSize: 12,
          },
        }
      : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          color: 'rgba(59, 130, 246, 0.05)',
        },
      },
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: '#334155',
      borderWidth: 1,
      textStyle: {
        color: '#F1F5F9',
      },
    },
    legend: showLegend
      ? {
          show: true,
          right: 0,
          top: title ? 0 : 0,
          itemWidth: 12,
          itemHeight: 12,
          itemGap: 16,
          textStyle: {
            color: '#94A3B8',
            fontSize: 12,
          },
          icon: 'roundRect',
        }
      : undefined,
    grid: {
      left: '3%',
      right: '3%',
      bottom: '3%',
      top: title ? 50 : 30,
      containLabel: true,
    },
    [horizontal ? 'yAxis' : 'xAxis']: {
      type: 'category',
      data: xAxisData,
      name: horizontal ? yAxisName : xAxisName,
      nameTextStyle: {
        color: '#64748B',
        fontSize: 12,
      },
      axisLine: {
        lineStyle: {
          color: '#334155',
        },
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#64748B',
        fontSize: 12,
      },
    },
    [horizontal ? 'xAxis' : 'yAxis']: {
      type: 'value',
      name: horizontal ? xAxisName : yAxisName,
      nameTextStyle: {
        color: '#64748B',
        fontSize: 12,
      },
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#64748B',
        fontSize: 12,
      },
      splitLine: {
        lineStyle: {
          color: '#1E293B',
          type: 'dashed',
        },
      },
    },
    series: series.map((s, index) => {
      const color = s.color || defaultColors[index % defaultColors.length];
      return {
        name: s.name,
        type: 'bar',
        data: s.data,
        stack: s.stack,
        barWidth: horizontal ? 16 : '40%',
        itemStyle: {
          color: {
            type: 'linear',
            x: horizontal ? 0 : 0,
            y: horizontal ? 0 : 0,
            x2: horizontal ? 1 : 0,
            y2: horizontal ? 0 : 1,
            colorStops: [
              { offset: 0, color: color },
              { offset: 1, color: color + '80' },
            ],
          },
          borderRadius: horizontal
            ? [0, 4, 4, 0]
            : [4, 4, 0, 0],
        },
        label: labelFormatter
          ? {
              show: true,
              position: horizontal ? 'right' : 'top',
              color: '#94A3B8',
              fontSize: 11,
              formatter: labelFormatter,
            }
          : undefined,
        emphasis: {
          itemStyle: {
            shadowColor: color,
            shadowBlur: 15,
          },
        },
      };
    }),
  };

  return (
    <div
      className={cn('w-full', className)}
      style={{ height, ...style }}
    >
      <ReactECharts
        ref={chartRef}
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
}
