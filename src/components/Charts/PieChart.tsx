import {
  useRef,
  useEffect,
  type CSSProperties,
} from 'react';
import ReactECharts from 'echarts-for-react';
import { cn } from '@/lib/utils';
import type { EChartsOption } from 'echarts';

export interface PieChartDataItem {
  name: string;
  value: number;
  color?: string;
}

export interface PieChartProps {
  data: PieChartDataItem[];
  title?: string;
  subtitle?: string;
  height?: string | number;
  innerRadius?: string | number;
  outerRadius?: string | number;
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  style?: CSSProperties;
  centerTitle?: string;
  centerValue?: string | number;
  centerSubtitle?: string;
  formatter?: (params: any) => string;
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

export function PieChart({
  data,
  title,
  subtitle,
  height = 300,
  innerRadius = '55%',
  outerRadius = '80%',
  showLegend = true,
  legendPosition = 'bottom',
  className,
  style,
  centerTitle,
  centerValue,
  centerSubtitle,
  formatter,
  onChartReady,
}: PieChartProps) {
  const chartRef = useRef<ReactECharts>(null);

  useEffect(() => {
    if (chartRef.current && onChartReady) {
      onChartReady(chartRef.current.getEchartsInstance());
    }
  }, [onChartReady]);

  const legendConfig = {
    top: { top: 0, left: 'center' },
    bottom: { bottom: 0, left: 'center' },
    left: { left: 0, top: 'center', orient: 'vertical' as const },
    right: { right: 0, top: 'center', orient: 'vertical' as const },
  };

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
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: '#334155',
      borderWidth: 1,
      textStyle: {
        color: '#F1F5F9',
      },
      formatter:
        formatter ||
        function (params: any) {
          return `<div style="font-weight:600;margin-bottom:4px">${params.name}</div>
            <div style="display:flex;justify-content:space-between;gap:16px">
              <span style="color:#94A3B8">数量</span>
              <span style="font-weight:600">${params.value}</span>
            </div>
            <div style="display:flex;justify-content:space-between;gap:16px;margin-top:2px">
              <span style="color:#94A3B8">占比</span>
              <span style="font-weight:600">${params.percent}%</span>
            </div>`;
        },
    },
    legend: showLegend
      ? {
          show: true,
          ...legendConfig[legendPosition],
          itemWidth: 10,
          itemHeight: 10,
          itemGap: 16,
          textStyle: {
            color: '#94A3B8',
            fontSize: 12,
          },
          icon: 'circle',
          formatter: function (name: string) {
            const item = data.find((d) => d.name === name);
            const total = data.reduce((sum, d) => sum + d.value, 0);
            const percent = item ? ((item.value / total) * 100).toFixed(1) : '0';
            return `${name}  ${percent}%`;
          },
        }
      : undefined,
    graphic:
      centerTitle || centerValue !== undefined
        ? [
            {
              type: 'text' as const,
              left: 'center',
              top: centerSubtitle ? '38%' : '42%',
              style: {
                text: centerTitle || '',
                fill: '#64748B',
                fontSize: 12,
                fontWeight: 500,
                align: 'center' as const,
              },
            },
            {
              type: 'text' as const,
              left: 'center',
              top: centerTitle ? '48%' : '42%',
              style: {
                text: String(centerValue ?? ''),
                fill: '#F1F5F9',
                fontSize: 28,
                fontWeight: 700,
                align: 'center' as const,
              },
            },
            ...(centerSubtitle
              ? [
                  {
                    type: 'text' as const,
                    left: 'center',
                    top: '62%',
                    style: {
                      text: centerSubtitle,
                      fill: '#64748B',
                      fontSize: 12,
                      align: 'center' as const,
                    },
                  },
                ]
              : []),
          ]
        : undefined,
    series: [
      {
        type: 'pie',
        radius: [innerRadius, outerRadius],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#0F172A',
          borderWidth: 3,
        },
        label: {
          show: false,
        },
        labelLine: {
          show: false,
        },
        emphasis: {
          scale: true,
          scaleSize: 8,
          itemStyle: {
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        data: data.map((item, index) => ({
          name: item.name,
          value: item.value,
          itemStyle: {
            color: item.color || defaultColors[index % defaultColors.length],
          },
        })),
      },
    ],
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
