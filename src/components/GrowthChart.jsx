import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

export default function GrowthChart({
  data
}) {
  return (
    <div className="h-[320px]">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient
              id="approved"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#2563eb"
                stopOpacity={0.3}
              />
              <stop
                offset="100%"
                stopColor="#2563eb"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            opacity={0.15}
          />

          <XAxis dataKey="month" />

          <YAxis />

          <Tooltip />

          <Area
            type="monotone"
            dataKey="approved"
            stroke="#2563eb"
            strokeWidth={3}
            fill="url(#approved)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}