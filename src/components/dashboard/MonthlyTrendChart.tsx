"use client";

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

interface MonthlyTrendChartProps {
  data: MonthlyData[];
}

export default function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-navy-700/30 bg-navy-900/30">
        <p className="text-sm text-slate-500">No trend data available</p>
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.flatMap((d) => [d.income, d.expenses])
  );

  const formatAmount = (amount: number): string => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount}`;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Chart area */}
      <div className="flex flex-1 items-end gap-3">
        {data.map((item) => {
          const incomeHeight =
            maxValue > 0 ? (item.income / maxValue) * 100 : 0;
          const expenseHeight =
            maxValue > 0 ? (item.expenses / maxValue) * 100 : 0;

          return (
            <div
              key={item.month}
              className="group flex flex-1 flex-col items-center gap-1"
            >
              {/* Bars container */}
              <div className="flex w-full items-end justify-center gap-1.5" style={{ height: "160px" }}>
                {/* Income bar */}
                <div className="relative flex w-5 flex-col items-center sm:w-7">
                  <div
                    className="w-full rounded-t-sm bg-teal-400 transition-all duration-500 ease-out hover:brightness-110"
                    style={{
                      height: `${incomeHeight}%`,
                      minHeight: incomeHeight > 0 ? "4px" : "0px",
                    }}
                    title={`Income: ${formatAmount(item.income)}`}
                  />
                </div>
                {/* Expense bar */}
                <div className="relative flex w-5 flex-col items-center sm:w-7">
                  <div
                    className="w-full rounded-t-sm bg-coral-400 transition-all duration-500 ease-out hover:brightness-110"
                    style={{
                      height: `${expenseHeight}%`,
                      minHeight: expenseHeight > 0 ? "4px" : "0px",
                    }}
                    title={`Expenses: ${formatAmount(item.expenses)}`}
                  />
                </div>
              </div>

              {/* Month label */}
              <span className="mt-2 text-xs text-slate-500">{item.month}</span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 border-t border-navy-700/30 pt-3">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-teal-400" />
          <span className="text-xs text-slate-400">Income</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-coral-400" />
          <span className="text-xs text-slate-400">Expenses</span>
        </div>
      </div>
    </div>
  );
}
