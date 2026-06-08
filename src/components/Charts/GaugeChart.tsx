import {
  useRef,
  useEffect,
  type CSSProperties,
} from 'react';
import ReactECharts from 'echarts-for-react';
import { cn } from '@/lib/utils';
import type { EChartsOption } from 'echarts';

export interface GaugeChartProps {
  value: number;
  max?: number;
  min?: number;
  title?: string;
  unit?: string;
  height?: string | number;
  className?: string;
  style?: CSSProperties;
  color?: string;
  splitNumber?: number;
  showAxisLine?: boolean;
  centerTitle?: string;
  centerValue?: string | number;
  centerSubtitle?: string;
  onChartReady?: (instance: any) => void;
}

export function GaugeChart({
  value,
  max = 100,
  min = 0,
  title,
  unit,
  height = 200,
  className,
  style,
  color,
  splitNumber = 5,
  showAxisLine = true,
  centerTitle,
  centerValue,
  centerSubtitle,
  onChartReady,
}: GaugeChartProps) {
  const chartRef = useRef<ReactECharts>(null);

  useEffect(() => {
    if (chartRef.current && onChartReady) {
      onChartReady(chartRef.current.getEchartsInstance());
    }
  }, [onChartReady]);

  const getProgressColor = () => {
    if (color) return color;
    const percent = (value - min) / (max - min);
    if (percent >= 0.9) return '#EF4444';
    if (percent >= 0.7) return '#F59E0B';
    if (percent >= 0.5) return '#F97316';
    return '#3B82F6';
  };

  const progressColor = getProgressColor();

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    title: title
      ? {
          text: title,
          left: 'center',
          bottom: 0,
          textStyle: {
            color: '#64748B',
            fontSize: 13,
            fontWeight: 500,
          },
        }
      : undefined,
    graphic:
      centerTitle !== undefined || centerValue !== undefined
        ? [
            ...(centerTitle
              ? [
                  {
                    type: 'text' as const,
                    left: 'center',
                    top: centerSubtitle ? '38%' : '42%',
                    style: {
                      text: centerTitle,
                      fill: '#64748B',
                      fontSize: 12,
                      fontWeight: 500,
                      align: 'center' as const,
                    },
                  },
                ]
              : []),
            {
              type: 'text' as const,
              left: 'center',
              top: centerTitle ? '48%' : '42%',
              style: {
                text: unit ? `${centerValue ?? value}${unit}` : `${centerValue ?? value}`,
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
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min,
        max,
        splitNumber,
        radius: '90%',
        center: ['50%', '60%'],
        itemStyle: {
          color: progressColor,
          shadowColor: progressColor,
          shadowBlur: 20,
          shadowOffsetY: 0,
        },
        progress: {
          show: true,
          width: 12,
          roundCap: true,
        },
        pointer: {
          icon: 'path://M2090.36389,615.30999 L2090.36389,615.30999 C2091.48372,615.30999 2092.40383,616.194028 2092.44859,617.312956 L2096.90698,728.755929 C2097.05155,732.369577 2094.2393,735.416212 2090.62566,735.56078 C2090.53845,735.564269 2090.45117,735.566014 2090.36389,735.566014 L2090.36389,735.566014 C2086.74736,735.566014 2083.82627,732.63447 2083.82627,729.017944 C2083.82627,728.930992 2083.82801,728.843965 2083.83148,728.757077 L2088.28986,617.312956 C2088.33467,616.194089 2089.25477,615.30999 2090.37466,615.30999 Z',
          length: '65%',
          width: 8,
          offsetCenter: [0, '5%'],
          itemStyle: {
            color: progressColor,
          },
        },
        axisLine: showAxisLine
          ? {
              lineStyle: {
                width: 12,
                color: [[1, '#1E293B']],
              },
              roundCap: true,
            }
          : { show: false },
        axisTick: {
          show: false,
        },
        splitLine: {
          show: false,
        },
        axisLabel: {
          show: false,
        },
        anchor: {
          show: true,
          showAbove: true,
          size: 18,
          itemStyle: {
            borderWidth: 4,
            borderColor: progressColor,
            color: '#0F172A',
          },
        },
        detail: {
          show: false,
        },
        title: {
          show: false,
        },
        data: [
          {
            value,
          },
        ],
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
