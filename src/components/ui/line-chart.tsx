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

interface FundingRateChartProps {
  data: { date: string; [key: string]: number }[]
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
            dataKey="date"
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <YAxis
            tickFormatter={(value) => `${(value * 100).toFixed(4)}%`}
          />
          <Tooltip 
            formatter={(value) => `${(Number(value) * 100).toFixed(4)}%`}
          />
          <Legend />
          {lines.map((line, index) => (
            <Line
              key={line}
              type="monotone"
              dataKey={line}
              stroke={`hsl(${index * 60}, 70%, 50%)`}
              activeDot={{ r: 8 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
