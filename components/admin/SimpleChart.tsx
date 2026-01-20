'use client';

import { useMemo } from 'react';

interface SimpleChartData {
  label: string;
  value: number;
}

interface SimpleChartProps {
  data: SimpleChartData[];
  type?: 'bar' | 'line';
  height?: number;
  color?: string;
  showValues?: boolean;
  viewMode?: 'daily' | 'weekly' | 'monthly';
}

export function SimpleChart({
  data,
  type = 'bar',
  height = 200,
  color = '#8b5cf6',
  showValues = false,
  viewMode = 'daily',
}: SimpleChartProps) {
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Get max value for scaling
    const maxValue = Math.max(...data.map(item => item.value));
    
    return data.map((item, index) => ({
      ...item,
      percentage: maxValue > 0 ? (item.value / maxValue) * 100 : 0,
      index,
    }));
  }, [data]);

  const formatLabel = (label: string, mode: string) => {
    if (mode === 'daily') {
      return new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    if (mode === 'weekly') {
      return `W${Math.floor(new Date(label).getTime() / (7 * 24 * 60 * 60 * 1000))}`;
    }
    if (mode === 'monthly') {
      return new Date(label).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
    return label;
  };

  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-muted"
        style={{ height }}
      >
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  if (type === 'bar') {
    return (
      <div className="w-full">
        <div 
          className="relative flex items-end justify-between gap-2 px-4"
          style={{ height }}
        >
          {processedData.map((item) => (
            <div key={item.index} className="flex flex-col items-center flex-1 max-w-20">
              {/* Bar */}
              <div 
                className="w-full rounded-t-md transition-all duration-500 ease-out hover:opacity-80 relative group"
                style={{ 
                  height: `${item.percentage}%`,
                  backgroundColor: color,
                  minHeight: item.value > 0 ? '4px' : '0px'
                }}
              >
                {/* Value tooltip on hover */}
                {showValues && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item.value}
                  </div>
                )}
              </div>
              
              {/* Label */}
              <div className="text-xs text-muted-foreground mt-2 text-center">
                {formatLabel(item.label, viewMode)}
              </div>
            </div>
          ))}
        </div>
        
        {/* Y-axis labels */}
        <div className="flex flex-col items-start mt-2 ml-2">
          <div className="text-xs text-muted-foreground">
            Max: {Math.max(...data.map(item => item.value))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'line') {
    const points = processedData.map((item, index) => ({
      x: (index / (processedData.length - 1)) * 100,
      y: 100 - item.percentage,
    }));

    const pathData = points.reduce((acc, point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${acc} ${command} ${point.x} ${point.y}`;
    }, '');

    return (
      <div className="w-full">
        <div className="relative" style={{ height }}>
          {/* SVG Line Chart */}
          <svg 
            className="w-full h-full" 
            viewBox="0 0 100 100" 
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(y => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.1"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            
            {/* Line path */}
            <path
              d={pathData}
              fill="none"
              stroke={color}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              className="transition-all duration-500"
            />
            
            {/* Data points */}
            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="1"
                fill={color}
                className="transition-all duration-500 hover:r-2"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          
          {/* Value tooltips */}
          {showValues && processedData.map((item, index) => (
            <div
              key={index}
              className="absolute text-xs bg-gray-800 text-white px-1 py-0.5 rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
              style={{
                left: `${points[index]?.x}%`,
                top: `${points[index]?.y}%`,
                transform: 'translate(-50%, -100%)'
              }}
            >
              {item.value}
            </div>
          ))}
        </div>
        
        {/* X-axis labels */}
        <div className="flex justify-between mt-2">
          {processedData.map((item, index) => {
            // Show only a subset of labels to avoid crowding
            const shouldShowLabel = processedData.length <= 7 || index % Math.ceil(processedData.length / 5) === 0;
            return shouldShowLabel ? (
              <div key={index} className="text-xs text-muted-foreground">
                {formatLabel(item.label, viewMode)}
              </div>
            ) : null;
          })}
        </div>
      </div>
    );
  }

  return null;
}