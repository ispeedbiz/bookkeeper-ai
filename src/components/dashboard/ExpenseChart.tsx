"use client";

interface ExpenseCategory {
  category: string;
  amount: number;
  color: string;
}

interface ExpenseChartProps {
  data: ExpenseCategory[];
}

export default function ExpenseChart({ data }: ExpenseChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-navy-700/30 bg-navy-900/30">
        <p className="text-sm text-slate-500">No expense data available</p>
      </div>
    );
  }

  const maxAmount = Math.max(...data.map((d) => d.amount));

  const formatAmount = (amount: number): string => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-4">
      {data.map((item) => {
        const widthPercent = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;

        return (
          <div key={item.category} className="group">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">
                {item.category}
              </span>
              <span className="text-sm font-semibold text-white">
                {formatAmount(item.amount)}
              </span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-navy-800/80">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: item.color,
                  minWidth: widthPercent > 0 ? "8px" : "0px",
                }}
              />
            </div>
          </div>
        );
      })}

      {/* Total */}
      <div className="mt-2 flex items-center justify-between border-t border-navy-700/30 pt-3">
        <span className="text-sm font-medium text-slate-400">Total</span>
        <span className="text-sm font-bold text-white">
          ${data.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
