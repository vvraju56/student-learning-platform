'use client';

interface ReportsChartProps {
  type: 'line' | 'bar' | 'pie';
}

const weeklyData = [
  { day: 'Mon', hours: 2.5 },
  { day: 'Tue', hours: 3 },
  { day: 'Wed', hours: 2.8 },
  { day: 'Thu', hours: 3.5 },
  { day: 'Fri', hours: 3.2 },
  { day: 'Sat', hours: 2 },
  { day: 'Sun', hours: 1.5 },
];

const monitoringData = [
  { category: 'Good Posture', value: 78 },
  { category: 'Issues', value: 22 },
];

const COLORS = ['#10b981', '#f97316'];

export default function ReportsChart({ type }: ReportsChartProps) {
  if (type === 'line') {
    const maxHours = 4;
    const width = 400;
    const height = 300;
    const padding = 40;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;

    return (
      <div className="w-full overflow-x-auto">
        <svg width={width} height={height} className="mx-auto">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={`grid-${i}`}
              x1={padding}
              y1={padding + (i * graphHeight) / 4}
              x2={width - padding}
              y2={padding + (i * graphHeight) / 4}
              stroke="#e5e7eb"
              strokeDasharray="3 3"
            />
          ))}

          {/* Axes */}
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#374151" strokeWidth={2} />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#374151" strokeWidth={2} />

          {/* Line chart */}
          <polyline
            points={weeklyData
              .map((d, i) => {
                const x = padding + (i * graphWidth) / (weeklyData.length - 1);
                const y = height - padding - (d.hours / maxHours) * graphHeight;
                return `${x},${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2}
          />

          {/* Data points */}
          {weeklyData.map((d, i) => {
            const x = padding + (i * graphWidth) / (weeklyData.length - 1);
            const y = height - padding - (d.hours / maxHours) * graphHeight;
            return (
              <circle key={`point-${i}`} cx={x} cy={y} r={4} fill="#3b82f6" />
            );
          })}

          {/* Labels */}
          {weeklyData.map((d, i) => {
            const x = padding + (i * graphWidth) / (weeklyData.length - 1);
            return (
              <text key={`label-${i}`} x={x} y={height - padding + 20} textAnchor="middle" fontSize={12} fill="#6b7280">
                {d.day}
              </text>
            );
          })}

          {/* Y-axis labels */}
          {[0, 1, 2, 3, 4].map((i) => (
            <text
              key={`y-label-${i}`}
              x={padding - 10}
              y={height - padding - (i * graphHeight) / 4 + 4}
              textAnchor="end"
              fontSize={12}
              fill="#6b7280"
            >
              {i}h
            </text>
          ))}
        </svg>
      </div>
    );
  }

  if (type === 'bar') {
    const width = 400;
    const height = 300;
    const padding = 40;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;
    const barWidth = graphWidth / (monitoringData.length * 2);

    return (
      <div className="w-full overflow-x-auto">
        <svg width={width} height={height} className="mx-auto">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((i) => (
            <line
              key={`grid-${i}`}
              x1={padding}
              y1={padding + ((100 - i) * graphHeight) / 100}
              x2={width - padding}
              y2={padding + ((100 - i) * graphHeight) / 100}
              stroke="#e5e7eb"
              strokeDasharray="3 3"
            />
          ))}

          {/* Axes */}
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#374151" strokeWidth={2} />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#374151" strokeWidth={2} />

          {/* Bars */}
          {monitoringData.map((d, i) => {
            const x = padding + (i * graphWidth) / monitoringData.length + graphWidth / (monitoringData.length * 2) - barWidth / 2;
            const barHeight = (d.value / 100) * graphHeight;
            const y = height - padding - barHeight;

            return (
              <rect
                key={`bar-${i}`}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={COLORS[i] || '#8b5cf6'}
              />
            );
          })}

          {/* Labels */}
          {monitoringData.map((d, i) => {
            const x = padding + (i * graphWidth) / monitoringData.length + graphWidth / (monitoringData.length * 2);
            return (
              <text
                key={`label-${i}`}
                x={x}
                y={height - padding + 20}
                textAnchor="middle"
                fontSize={12}
                fill="#6b7280"
              >
                {d.category.split(' ')[0]}
              </text>
            );
          })}

          {/* Y-axis labels */}
          {[0, 25, 50, 75, 100].map((i) => (
            <text
              key={`y-label-${i}`}
              x={padding - 10}
              y={height - padding - ((i * graphHeight) / 100) + 4}
              textAnchor="end"
              fontSize={12}
              fill="#6b7280"
            >
              {i}%
            </text>
          ))}
        </svg>
      </div>
    );
  }

  // Pie chart
  const total = monitoringData.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = -90;

  return (
    <div className="w-full flex justify-center">
      <svg width={300} height={300} viewBox="0 0 300 300">
        {monitoringData.map((d, i) => {
          const sliceAngle = (d.value / total) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + sliceAngle;

          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;

          const x1 = 150 + 80 * Math.cos(startRad);
          const y1 = 150 + 80 * Math.sin(startRad);
          const x2 = 150 + 80 * Math.cos(endRad);
          const y2 = 150 + 80 * Math.sin(endRad);

          const largeArc = sliceAngle > 180 ? 1 : 0;

          const pathData = `M 150 150 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;

          const labelRad = ((startAngle + endAngle) / 2 * Math.PI) / 180;
          const labelX = 150 + 50 * Math.cos(labelRad);
          const labelY = 150 + 50 * Math.sin(labelRad);

          currentAngle = endAngle;

          return (
            <g key={`slice-${i}`}>
              <path d={pathData} fill={COLORS[i]} />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                fontSize={14}
                fill="white"
                fontWeight="bold"
              >
                {d.value}%
              </text>
            </g>
          );
        })}

        {/* Legend */}
        {monitoringData.map((d, i) => (
          <g key={`legend-${i}`}>
            <rect x={10} y={220 + i * 20} width={12} height={12} fill={COLORS[i]} />
            <text x={30} y={228 + i * 20} fontSize={12} fill="#374151">
              {d.category}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
