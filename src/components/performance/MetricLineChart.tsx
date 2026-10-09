// Shared single-metric line chart + full-width metric picker, so every graph in
// the app looks and behaves identically.

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REPORT_LINE_WIDTH, REPORT_DOT_RADIUS } from "@/lib/report-chart";

export type ChartPoint = { label: string; value: number | null };

export function MetricPicker({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { key: string; label: string; color: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full font-semibold">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.key} value={o.key}>
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: o.color }}
              />
              {o.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function MetricLineChart({
  data,
  color,
  label,
  unit,
  compact = false,
  maxValue,
}: {
  data: ChartPoint[];
  color: string;
  label: string;
  unit: string;
  compact?: boolean;
  maxValue?: number;
}) {
  return (
    <div className={compact ? "h-36 w-full" : "h-48 w-full"} role="img" aria-label={`${label} trend`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            stroke="var(--border)"
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            domain={maxValue === undefined ? undefined : [0, maxValue]}
            allowDecimals={maxValue === undefined}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            stroke="var(--border)"
            width={40}
            tickFormatter={(v: number) =>
              Math.abs(v) >= 1000 ? `${Math.round(v / 100) / 10}k` : String(v)
            }
          />
          <Tooltip
            formatter={(v: number | string) => [`${v}${unit}`, label]}
            contentStyle={{
              fontSize: 12,
              background: "var(--card)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              borderRadius: 12,
            }}
            labelStyle={{ color: "var(--muted-foreground)" }}
            cursor={{ stroke: "var(--border)" }}
          />
          <Line
            type="linear"
            dataKey="value"
            stroke={color}
            strokeWidth={REPORT_LINE_WIDTH}
            connectNulls
            isAnimationActive={false}
            dot={{ r: REPORT_DOT_RADIUS, fill: color, stroke: color }}
            activeDot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
