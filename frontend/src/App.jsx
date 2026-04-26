import { useState, useEffect, useCallback } from 'react';
import { FaWallet } from 'react-icons/fa';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import Summary from './components/Summary';
import EditExpenseModal from './components/EditExpenseModal';
import { listExpenses, getSummary } from './api';

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortDateDesc, setSortDateDesc] = useState(true);
  const [editingExpense, setEditingExpense] = useState(null);

  const fetchData = useCallback(async () => {
    setError('');
    setLoadingList(true);
    setLoadingSummary(true);
    try {
      const [listData, summaryData] = await Promise.all([
        listExpenses({ category: filterCategory || undefined, sort: sortDateDesc ? 'date_desc' : undefined }),
        getSummary(),
      ]);
      setExpenses(listData);
      setSummary(summaryData);
    } catch (err) {
      setError('Failed to load data. Please refresh the page to retry.');
    } finally {
      setLoadingList(false);
      setLoadingSummary(false);
    }
  }, [filterCategory, sortDateDesc]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8 flex items-center gap-3">
        <FaWallet className="text-emerald-700 text-3xl" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expense Tracker</h1>
          <p className="text-sm text-slate-600">Track where your money goes</p>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 text-rose-700 rounded border border-rose-200">
          {error}
        </div>
      )}

      <ExpenseForm onCreated={fetchData} />

      <Summary summary={summary} loading={loadingSummary} />

      <ExpenseList
        expenses={expenses}
        loading={loadingList}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        sortDateDesc={sortDateDesc}
        setSortDateDesc={setSortDateDesc}
        summary={summary}
        onEdit={setEditingExpense}
        onDeleted={fetchData}
      />

      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onUpdated={fetchData}
        />
      )}
    </div>
  );
}

