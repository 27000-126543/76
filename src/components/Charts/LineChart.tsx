import {
  useRef,
  useEffect,
  type CSSProperties,
} from 'react';
import ReactECharts from 'echarts-for-react';
import { cn } from '@/lib/utils';
import type { EChartsOption } from 'echarts';

export interface LineChartSeries {
  name: string;
  data: number[];
  color?: string;
  smooth?: boolean;
  areaStyle?: boolean;
  type?: 'line' | 'bar';
}

export interface LineChartProps {
  xAxisData: string[];
  series: LineChartSeries[];
  title?: string;
  subtitle?: string;
  height?: string | number;
  showLegend?: boolean;
  showGrid?: boolean;
  className?: string;
  style?: CSSProperties;
  yAxisName?: string;
  yAxisFormatter?: (value: number) => string;
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

export function LineChart({
  xAxisData,
  series,
  title,
  subtitle,
  height = 300,
  showLegend = true,
  showGrid = true,
  className,
  style,
  yAxisName,
  yAxisFormatter,
  onChartReady,
}: LineChartProps) {
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
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: '#334155',
      borderWidth: 1,
      textStyle: {
        color: '#F1F5F9',
      },
      axisPointer: {
        type: 'cross',
        lineStyle: {
          color: '#475569',
          type: 'dashed',
        },
        crossStyle: {
          color: '#475569',
        },
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
      left: showGrid ? '3%' : '0%',
      right: showGrid ? '3%' : '0%',
      bottom: showGrid ? '3%' : '0%',
      top: title ? 50 : 30,
      containLabel: true,
      show: false,
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      boundaryGap: false,
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
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      name: yAxisName,
      nameTextStyle: {
        color: '#64748B',
        fontSize: 12,
        padding: [0, 0, 0, -10],
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
        formatter: yAxisFormatter,
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
        type: s.type || 'line',
        data: s.data,
        smooth: s.smooth !== false,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        lineStyle: {
          width: 2.5,
          color,
          shadowColor: color,
          shadowBlur: 10,
          shadowOffsetY: 5,
        },
        itemStyle: {
          color,
          borderWidth: 2,
          borderColor: '#0F172A',
        },
        areaStyle: s.areaStyle
          ? {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: color + '40',
                  },
                  {
                    offset: 1,
                    color: color + '00',
                  },
                ],
              },
            }
          : undefined,
        emphasis: {
          focus: 'series',
          itemStyle: {
            borderWidth: 3,
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
