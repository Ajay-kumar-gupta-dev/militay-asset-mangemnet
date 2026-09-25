import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/layout/Layout.jsx';
import apiClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext.jsx';

const emptyAssignment = { equipment_type_id: '', quantity: '', assigned_to_name: '', assigned_to_service_no: '', assignment_date: '', base_id: '' };
const emptyExpenditure = { equipment_type_id: '', quantity: '', reason: 'training', expenditure_date: '', base_id: '' };

export default function Assignments() {
  const { user } = useAuth();
  const [tab, setTab] = useState('assignments');
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [assignForm, setAssignForm] = useState(emptyAssignment);
  const [expendForm, setExpendForm] = useState(emptyExpenditure);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    apiClient.get('/bases').then((res) => setBases(res.data));
    apiClient.get('/equipment-types').then((res) => setEquipmentTypes(res.data));
  }, []);

  const loadAssignments = useCallback(async () => {
    const { data } = await apiClient.get('/assignments');
    setAssignments(data.data);
  }, []);
  const loadExpenditures = useCallback(async () => {
    const { data } = await apiClient.get('/expenditures');
    setExpenditures(data.data);
  }, []);

  useEffect(() => { loadAssignments(); loadExpenditures(); }, [loadAssignments, loadExpenditures]);

  const fieldClass =
    'rounded border border-ink-border bg-ink px-3 py-2 text-sm text-parchment focus:border-olive-dim focus:outline-none w-full';

  const submitAssignment = async (e) => {
    e.preventDefault();
    setSubmitting(true); setFormError(null);
    try {
      await apiClient.post('/assignments', assignForm);
      setAssignForm(emptyAssignment);
      loadAssignments();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to record assignment');
    } finally { setSubmitting(false); }
  };

  const submitExpenditure = async (e) => {
    e.preventDefault();
    setSubmitting(true); setFormError(null);
    try {
      await apiClient.post('/expenditures', expendForm);
      setExpendForm(emptyExpenditure);
      loadExpenditures();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to record expenditure');
    } finally { setSubmitting(false); }
  };

  const returnAssignment = async (id) => {
    await apiClient.patch(`/assignments/${id}/return`, {});
    loadAssignments();
  };

  return (
    <Layout title="Assignments & Expenditures">
      <div className="mb-5 flex gap-2">
        {['assignments', 'expenditures'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded px-4 py-2 text-sm capitalize transition-colors ${
              tab === t ? 'bg-olive-dim text-parchment' : 'bg-ink-surface text-parchment-muted hover:text-parchment'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'assignments' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <form onSubmit={submitAssignment} className="space-y-3 rounded border border-ink-border bg-ink-surface p-5 lg:col-span-1">
            <p className="font-display text-sm font-semibold text-parchment">Assign to personnel</p>
            {user.role === 'admin' && (
              <select required className={fieldClass} value={assignForm.base_id} onChange={(e) => setAssignForm({ ...assignForm, base_id: e.target.value })}>
                <option value="">Select base…</option>
                {bases.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
            <select required className={fieldClass} value={assignForm.equipment_type_id} onChange={(e) => setAssignForm({ ...assignForm, equipment_type_id: e.target.value })}>
              <option value="">Equipment type…</option>
              {equipmentTypes.map((eq) => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
            </select>
            <input required type="number" min="1" placeholder="Quantity" className={fieldClass} value={assignForm.quantity} onChange={(e) => setAssignForm({ ...assignForm, quantity: e.target.value })} />
            <input required placeholder="Assigned to (name)" className={fieldClass} value={assignForm.assigned_to_name} onChange={(e) => setAssignForm({ ...assignForm, assigned_to_name: e.target.value })} />
            <input placeholder="Service no. (optional)" className={fieldClass} value={assignForm.assigned_to_service_no} onChange={(e) => setAssignForm({ ...assignForm, assigned_to_service_no: e.target.value })} />
            <input required type="date" className={fieldClass} value={assignForm.assignment_date} onChange={(e) => setAssignForm({ ...assignForm, assignment_date: e.target.value })} />
            {formError && <p className="text-sm text-rust-bright">{formError}</p>}
            <button type="submit" disabled={submitting} className="w-full rounded bg-olive-dim py-2 text-sm font-medium text-parchment hover:bg-olive disabled:opacity-50">
              {submitting ? 'Recording…' : 'Assign'}
            </button>
          </form>

          <div className="overflow-x-auto rounded border border-ink-border bg-ink-surface lg:col-span-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-border text-left text-xs uppercase tracking-wide text-parchment-muted">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Personnel</th>
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-parchment-muted">No assignments recorded yet.</td></tr>
                ) : assignments.map((a) => (
                  <tr key={a.id} className="border-b border-ink-border last:border-0">
                    <td className="px-4 py-2.5 text-parchment-muted">{a.assignment_date}</td>
                    <td className="px-4 py-2.5">{a.assigned_to_name}</td>
                    <td className="px-4 py-2.5">{a.EquipmentType?.name}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{a.quantity}</td>
                    <td className="px-4 py-2.5 capitalize text-amber-bright">{a.status}</td>
                    <td className="px-4 py-2.5">
                      {a.status === 'active' && (
                        <button onClick={() => returnAssignment(a.id)} className="text-xs text-olive-bright hover:underline">Mark returned</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <form onSubmit={submitExpenditure} className="space-y-3 rounded border border-ink-border bg-ink-surface p-5 lg:col-span-1">
            <p className="font-display text-sm font-semibold text-parchment">Record expenditure</p>
            {user.role === 'admin' && (
              <select required className={fieldClass} value={expendForm.base_id} onChange={(e) => setExpendForm({ ...expendForm, base_id: e.target.value })}>
                <option value="">Select base…</option>
                {bases.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
            <select required className={fieldClass} value={expendForm.equipment_type_id} onChange={(e) => setExpendForm({ ...expendForm, equipment_type_id: e.target.value })}>
              <option value="">Equipment type…</option>
              {equipmentTypes.map((eq) => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
            </select>
            <input required type="number" min="1" placeholder="Quantity" className={fieldClass} value={expendForm.quantity} onChange={(e) => setExpendForm({ ...expendForm, quantity: e.target.value })} />
            <select required className={fieldClass} value={expendForm.reason} onChange={(e) => setExpendForm({ ...expendForm, reason: e.target.value })}>
              {['training', 'operation', 'decommissioned', 'lost', 'other'].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <input required type="date" className={fieldClass} value={expendForm.expenditure_date} onChange={(e) => setExpendForm({ ...expendForm, expenditure_date: e.target.value })} />
            {formError && <p className="text-sm text-rust-bright">{formError}</p>}
            <button type="submit" disabled={submitting} className="w-full rounded bg-rust py-2 text-sm font-medium text-parchment hover:bg-rust-bright disabled:opacity-50">
              {submitting ? 'Recording…' : 'Record expenditure'}
            </button>
          </form>

          <div className="overflow-x-auto rounded border border-ink-border bg-ink-surface lg:col-span-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-border text-left text-xs uppercase tracking-wide text-parchment-muted">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {expenditures.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-parchment-muted">No expenditures recorded yet.</td></tr>
                ) : expenditures.map((ex) => (
                  <tr key={ex.id} className="border-b border-ink-border last:border-0">
                    <td className="px-4 py-2.5 text-parchment-muted">{ex.expenditure_date}</td>
                    <td className="px-4 py-2.5">{ex.EquipmentType?.name}</td>
                    <td className="px-4 py-2.5 capitalize text-rust-bright">{ex.reason}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{ex.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
