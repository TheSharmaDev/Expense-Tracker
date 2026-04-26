import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FaRupeeSign, FaPlus, FaSpinner } from 'react-icons/fa';
import { createExpense } from '../api';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Other'];

export default function ExpenseForm({ onCreated }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = useCallback(() => {
    setAmount('');
    setCategory('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setError('');
  }, []);

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
      const clientId = sessionStorage.getItem('pending_expense_client_id') || uuidv4();
      sessionStorage.setItem('pending_expense_client_id', clientId);
      await createExpense({
        amount: amt.toFixed(2),
        category,
        description: description.trim(),
        date,
        client_id: clientId,
      });
      sessionStorage.removeItem('pending_expense_client_id');
      resetForm();
      onCreated();
    } catch (err) {
      setError(err.message || 'Failed to save expense. Please check your filled data.');
    } finally {
      setLoading(false);
    }
  }, [amount, category, description, date, onCreated, resetForm]);

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FaPlus className="text-emerald-600" />
        Add Expense
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 text-rose-700 rounded border border-rose-200 text-sm">
          {error}
        </div>
      )}

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

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? <FaSpinner className="animate-spin" /> : <FaPlus />}
          {loading ? 'Saving...' : 'Add Expense'}
        </button>
      </div>
    </form>
  );
}

