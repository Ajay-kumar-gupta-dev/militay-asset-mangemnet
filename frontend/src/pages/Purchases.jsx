import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/layout/Layout.jsx';
import FilterBar from '../components/common/FilterBar.jsx';
import apiClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = { equipment_type_id: '', quantity: '', purchase_date: '', vendor: '', reference_no: '', base_id: '' };

export default function Purchases() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({});
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    apiClient.get('/bases').then((res) => setBases(res.data));
    apiClient.get('/equipment-types').then((res) => setEquipmentTypes(res.data));
  }, []);

  const loadPurchases = useCallback(async () => {
    const { data } = await apiClient.get('/purchases', { params: filters });
    setPurchases(data.data);
  }, [filters]);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await apiClient.post('/purchases', form);
      setForm(emptyForm);
      loadPurchases();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to record purchase');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    'rounded border border-ink-border bg-ink px-3 py-2 text-sm text-parchment focus:border-olive-dim focus:outline-none';

  return (
    <Layout title="Purchases">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="space-y-3 rounded border border-ink-border bg-ink-surface p-5">
            <p className="font-display text-sm font-semibold text-parchment">Record a purchase</p>

            {user.role === 'admin' && (
              <select
                required
                className={fieldClass + ' w-full'}
                value={form.base_id}
                onChange={(e) => setForm({ ...form, base_id: e.target.value })}
              >
                <option value="">Select base…</option>
                {bases.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}

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
              value={form.purchase_date}
              onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
            />
            <input
              placeholder="Vendor (optional)"
              className={fieldClass + ' w-full'}
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
            />
            <input
              placeholder="Reference no. (optional)"
              className={fieldClass + ' w-full'}
              value={form.reference_no}
              onChange={(e) => setForm({ ...form, reference_no: e.target.value })}
            />

            {formError && <p className="text-sm text-rust-bright">{formError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded bg-olive-dim py-2 text-sm font-medium text-parchment transition-colors hover:bg-olive disabled:opacity-50"
            >
              {submitting ? 'Recording…' : 'Record purchase'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <FilterBar
            filters={filters}
            onChange={setFilters}
            bases={bases}
            equipmentTypes={equipmentTypes}
            showBaseFilter={user.role === 'admin'}
          />

          <div className="overflow-x-auto rounded border border-ink-border bg-ink-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-border text-left text-xs uppercase tracking-wide text-parchment-muted">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Base</th>
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-parchment-muted">No purchases recorded yet.</td></tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id} className="border-b border-ink-border last:border-0">
                      <td className="px-4 py-2.5 text-parchment-muted">{p.purchase_date}</td>
                      <td className="px-4 py-2.5">{p.Base?.name}</td>
                      <td className="px-4 py-2.5">{p.EquipmentType?.name}</td>
                      <td className="px-4 py-2.5 text-parchment-muted">{p.vendor || '—'}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{p.quantity}</td>
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
