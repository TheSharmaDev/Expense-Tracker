import { useState, useEffect, useCallback } from 'react';
import { FaRupeeSign, FaSpinner, FaSave, FaTrash, FaTimes } from 'react-icons/fa';
import { updateExpense, deleteExpense } from '../api';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Other'];

export default function EditExpenseModal({ expense, onClose, onUpdated }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (expense) {
      setAmount(expense.amount);
      setCategory(expense.category);
      setDescription(expense.description);
      setDate(expense.date);
      setError('');
    }
  }, [expense]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');

    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError('Amount must be a positive number');
      return;
    }
    if (!category) {
      setError('Please select a category');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    if (!date) {
      setError('Date is required');
      return;
    }
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedUTC = Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    if (selectedUTC > todayUTC) {
      setError('Date cannot be in the future');
      return;
    }

    setLoading(true);
    try {
      await updateExpense(expense.id, {
        amount: amt.toFixed(2),
        category,
        description: description.trim(),
        date,
      });
      onUpdated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update expense. Please check your filled data.');
    } finally {
      setLoading(false);
    }
  }, [amount, category, description, date, expense, onUpdated, onClose]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    setLoading(true);
    try {
      await deleteExpense(expense.id);
      onUpdated();
      onClose();
    } catch (err) {
      setError('Failed to delete expense.');
    } finally {
      setLoading(false);
    }
  }, [expense, onUpdated, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6 relative animate-[fadeIn_0.2s_ease-out]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FaSave className="text-emerald-600" />
            Edit Expense
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 transition-colors"
            title="Close"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-700 rounded border border-rose-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500"><FaRupeeSign /></span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="What was this for?"
                required
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
              {loading ? 'Saving...' : 'Update Expense'}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FaTrash /> Delete
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-slate-200 text-slate-800 px-4 py-2 rounded hover:bg-slate-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FaTimes /> Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

