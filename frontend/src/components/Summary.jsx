import { useMemo } from 'react';
import { FaRupeeSign, FaChartPie, FaSpinner } from 'react-icons/fa';

export default function Summary({ summary, loading }) {
  const sorted = useMemo(() => {
    return [...summary].sort((a, b) => parseFloat(b.total) - parseFloat(a.total));
  }, [summary]);

  const grandTotal = useMemo(() => {
    return summary.reduce((sum, s) => sum + parseFloat(s.total), 0);
  }, [summary]);

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FaChartPie className="text-emerald-600" /> Summary by Category
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-500">
          <FaSpinner className="animate-spin mr-2" /> Loading...
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-8 text-slate-500">No data yet.</div>
      ) : (
        <div className="space-y-3">
          {sorted.map((s) => {
            const pct = grandTotal > 0 ? (parseFloat(s.total) / grandTotal) * 100 : 0;
            return (
              <div key={s.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">{s.category}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                    <FaRupeeSign className="text-xs" />
                    {parseFloat(s.total).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    <span className="text-xs text-slate-500 ml-1">({pct.toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div
                    className="bg-emerald-600 h-2.5 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

