import { useMemo } from 'react';
import { FaRupeeSign, FaSortAmountDown, FaFilter, FaSpinner, FaEdit, FaTrash } from 'react-icons/fa';
import { deleteExpense } from '../api';

export default function ExpenseList({
  expenses,
  loading,
  filterCategory,
  setFilterCategory,
  sortDateDesc,
  setSortDateDesc,
  summary,
  onEdit,
  onDeleted,
}) {
  const categories = useMemo(() => {
    const set = new Set(summary.map((s) => s.category));
    return Array.from(set).sort();
  }, [summary]);

  const total = useMemo(() => {
    return expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  }, [expenses]);

  const formattedTotal = total.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await deleteExpense(id);
      onDeleted();
    } catch (err) {
      alert('Failed to delete expense.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold">Expenses</h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <FaFilter className="text-slate-500" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setSortDateDesc((v) => !v)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded border text-sm ${
              sortDateDesc
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FaSortAmountDown />
            {sortDateDesc ? 'Newest first' : 'Sort by date'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <FaSpinner className="animate-spin mr-2" /> Loading...
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No expenses found.</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-slate-700 uppercase">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Date</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(e.date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">{e.description}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      <span className="inline-flex items-center gap-1">
                        <FaRupeeSign className="text-xs" />
                        {parseFloat(e.amount).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => onEdit(e)}
                          className="text-emerald-600 hover:text-emerald-800 p-1"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="text-rose-600 hover:text-rose-800 p-1"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end items-center gap-2 text-lg font-semibold text-slate-800">
            <span className="text-slate-600">Total:</span>
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <FaRupeeSign />
              {formattedTotal}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

