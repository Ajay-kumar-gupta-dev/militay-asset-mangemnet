import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/layout/Layout.jsx';
import FilterBar from '../components/common/FilterBar.jsx';
import apiClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = { from_base_id: '', to_base_id: '', equipment_type_id: '', quantity: '', transfer_date: '' };

export default function Transfers() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({});
  const [bases, setBases] = useState([]);
  const [allBases, setAllBases] = useState([]); // needed for the "to base" picker even for non-admins
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    apiClient.get('/bases').then((res) => setBases(res.data));
    apiClient.get('/equipment-types').then((res) => setEquipmentTypes(res.data));
  }, []);

  const loadTransfers = useCallback(async () => {
    const { data } = await apiClient.get('/transfers', { params: filters });
    setTransfers(data.data);
  }, [filters]);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await apiClient.post('/transfers', form);
      setForm(emptyForm);
      loadTransfers();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to record transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    'rounded border border-ink-border bg-ink px-3 py-2 text-sm text-parchment focus:border-olive-dim focus:outline-none';

  return (
    <Layout title="Transfers">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="space-y-3 rounded border border-ink-border bg-ink-surface p-5">
            <p className="font-display text-sm font-semibold text-parchment">Initiate a transfer</p>

            {user.role === 'admin' ? (
              <select
                required
                className={fieldClass + ' w-full'}
                value={form.from_base_id}
                onChange={(e) => setForm({ ...form, from_base_id: e.target.value })}
              >
                <option value="">From base…</option>
                {bases.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-parchment-muted">From: {user.base?.name} (your assigned base)</p>
            )}

            <select
              required
              className={fieldClass + ' w-full'}
              value={form.to_base_id}
              onChange={(e) => setForm({ ...form, to_base_id: e.target.value })}
            >
              <option value="">To base…</option>
              {bases.filter((b) => b.id !== (user.role === 'admin' ? form.from_base_id : user.base?.id)).map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            <select
              required
              className={fieldClass + ' w-full'}
              value={form.equipment_type_id}
              onChange={(e) => setForm({ ...form, equipment_type_id: e.target.value })}
            >
              <option value="">Equipment type…</option>
              {equipmentTypes.map((eq) => (
                <option key={eq.id} value={eq.id}>{eq.name} ({eq.unit})</option>
              ))}
            </select>

            <input
              required
              type="number"
              min="1"
              placeholder="Quantity"
              className={fieldClass + ' w-full'}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
            <input
              required
              type="date"
              className={fieldClass + ' w-full'}
              value={form.transfer_date}
              onChange={(e) => setForm({ ...form, transfer_date: e.target.value })}
            />

            {formError && <p className="text-sm text-rust-bright">{formError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded bg-olive-dim py-2 text-sm font-medium text-parchment transition-colors hover:bg-olive disabled:opacity-50"
            >
              {submitting ? 'Recording…' : 'Record transfer'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <FilterBar filters={filters} onChange={setFilters} equipmentTypes={equipmentTypes} showBaseFilter={false} />

          <div className="overflow-x-auto rounded border border-ink-border bg-ink-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-border text-left text-xs uppercase tracking-wide text-parchment-muted">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">To</th>
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {transfers.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-parchment-muted">No transfers recorded yet.</td></tr>
                ) : (
                  transfers.map((t) => (
                    <tr key={t.id} className="border-b border-ink-border last:border-0">
                      <td className="px-4 py-2.5 text-parchment-muted">{t.transfer_date}</td>
                      <td className="px-4 py-2.5">{t.fromBase?.name}</td>
                      <td className="px-4 py-2.5">{t.toBase?.name}</td>
                      <td className="px-4 py-2.5">{t.EquipmentType?.name}</td>
                      <td className="px-4 py-2.5 capitalize text-olive-bright">{t.status}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{t.quantity}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
