import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

export default function CityChart({
  data
}) {
  return (
    <div className="h-[320px]">
      <ResponsiveContainer>
        <BarChart
          layout="vertical"
          data={data}
        >
          <XAxis type="number" />
          <YAxis
            dataKey="label"
            type="category"
            width={90}
          />

          <Tooltip />

          <Bar
            dataKey="value"
            radius={[0, 8, 8, 0]}
            fill="#2563eb"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}