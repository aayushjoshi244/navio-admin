export default function CategoryBars({
  items
}) {
  const max = Math.max(
    ...items.map((i) => i.value),
    1
  );

  return (
    <div className="space-y-5">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-2 flex justify-between">
            <span className="text-sm text-slate-300">
              {item.label}
            </span>

            <span className="text-sm text-slate-500">
              {item.value}
            </span>
          </div>

          <div className="h-2 rounded-full bg-slate-800">
            <div
              className="h-2 rounded-full bg-blue-500"
              style={{
                width: `${
                  (item.value / max) * 100
                }%`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
