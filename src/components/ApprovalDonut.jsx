import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from "recharts";

export default function ApprovalDonut({
  approved,
  pending
}) {
  const data = [
    {
      name: "Approved",
      value: approved
    },
    {
      name: "Pending",
      value: pending
    }
  ];

  const COLORS = [
    "#2563eb",
    "#64748b"
  ];

  return (
    <div className="h-[320px]">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            innerRadius={90}
            outerRadius={120}
            dataKey="value"
            paddingAngle={3}
            cornerRadius={8}
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={COLORS[index]}
              />
            ))}
          </Pie>

          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}