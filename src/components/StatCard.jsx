import {
  TrendingUp,
  TrendingDown
} from "lucide-react";

export default function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendUp = true,
  icon: Icon
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">
            {title}
          </p>

          <h3 className="mt-3 text-3xl font-bold text-white">
            {value}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            {subtitle}
          </p>
        </div>

        <div className="rounded-xl bg-slate-800 p-3">
          <Icon size={22} className="text-blue-400" />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        {trendUp ? (
          <TrendingUp
            size={16}
            className="text-emerald-400"
          />
        ) : (
          <TrendingDown
            size={16}
            className="text-red-400"
          />
        )}

        <span
          className={`text-sm font-medium ${
            trendUp
              ? "text-emerald-400"
              : "text-red-400"
          }`}
        >
          {trend}
        </span>
      </div>
    </div>
  );
}