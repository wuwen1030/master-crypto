'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

// 通用数据点：以时间戳为横轴，其他键为数值序列
export type TimeSeriesPoint = { dateTs: number } & Record<string, number>

interface FundingRateChartProps {
  data: TimeSeriesPoint[]
  lines: string[]
}

export function FundingRateChart({ data, lines }: FundingRateChartProps) {
  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="dateTs"
            tickFormatter={(value) => new Date(Number(value)).toLocaleString()}
          />
          <YAxis
            tickFormatter={(value) => `${(Number(value) * 100).toFixed(4)}%`}
          />
          <Tooltip 
            labelFormatter={(label) => new Date(Number(label)).toLocaleString()}
            formatter={(value) => `${(Number(value) * 100).toFixed(4)}%`}
          />
          <Legend />
          {lines.map((line, index) => (
            <Line
              key={line}
              type="monotone"
              dataKey={line}
              dot={false}
              stroke={`hsl(${index * 60}, 70%, 50%)`}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
