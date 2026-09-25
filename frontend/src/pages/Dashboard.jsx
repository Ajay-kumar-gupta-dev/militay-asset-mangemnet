import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/layout/Layout.jsx';
import FilterBar from '../components/common/FilterBar.jsx';
import MetricCard from '../components/common/MetricCard.jsx';
import Modal from '../components/common/Modal.jsx';
import apiClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({});
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [detail, setDetail] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/bases').then((res) => setBases(res.data));
    apiClient.get('/equipment-types').then((res) => setEquipmentTypes(res.data));
  }, []);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    const { data } = await apiClient.get('/dashboard/summary', { params: filters });
    setSummary(data);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const openMovementDetail = async () => {
    const { data } = await apiClient.get('/dashboard/movement-detail', { params: filters });
    setDetail(data);
    setShowDetail(true);
  };

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          bases={bases}
          equipmentTypes={equipmentTypes}
          showBaseFilter={user.role === 'admin'}
        />

        {loading || !summary ? (
          <p className="text-sm text-parchment-muted">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <MetricCard label="Opening Balance" value={summary.openingBalance} />
              <MetricCard label="Closing Balance" value={summary.closingBalance} />
              <MetricCard
                label="Net Movement"
                value={summary.netMovement >= 0 ? `+${summary.netMovement}` : summary.netMovement}
                accent="olive"
                onClick={openMovementDetail}
                hint="Click for purchases / transfer breakdown"
              />
              <MetricCard label="Assigned" value={summary.assigned} accent="amber" />
              <MetricCard label="Expended" value={summary.expended} accent="rust" />
            </div>

            <div className="rounded border border-ink-border bg-ink-surface p-5 text-sm text-parchment-muted">
              <p>
                Net Movement = Purchases ({summary.purchases}) + Transfers In ({summary.transferIn}) − Transfers Out (
                {summary.transferOut})
              </p>
            </div>
          </>
        )}
      </div>

      {showDetail && detail && (
        <Modal title="Net Movement — Breakdown" onClose={() => setShowDetail(false)}>
          <DetailSection title="Purchases" rows={detail.purchases} dateKey="purchase_date" />
          <DetailSection title="Transfers In" rows={detail.transfersIn} dateKey="transfer_date" from />
          <DetailSection title="Transfers Out" rows={detail.transfersOut} dateKey="transfer_date" to />
        </Modal>
      )}
    </Layout>
  );
}

function DetailSection({ title, rows, dateKey, from, to }) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-xs uppercase tracking-wide text-parchment-muted">{title}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-parchment-muted">No records for the selected filters.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-ink-border last:border-0">
                <td className="py-1.5 pr-3 text-parchment-muted">{r[dateKey]}</td>
                <td className="py-1.5 pr-3">{r.EquipmentType?.name || '—'}</td>
                {from && <td className="py-1.5 pr-3 text-parchment-muted">from {r.fromBase?.name}</td>}
                {to && <td className="py-1.5 pr-3 text-parchment-muted">to {r.toBase?.name}</td>}
                <td className="py-1.5 text-right font-mono">{r.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
