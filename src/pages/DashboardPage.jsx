import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, CircleDollarSign, Gavel, Hourglass, Shield, UserPlus, Users } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { ErrorState, Loader } from '../components/common/Feedback';
import {
  AuctionProgress,
  ChartCard,
  DonutChart,
  PurseChart,
  RegistrationsChart,
  TeamDistributionChart,
} from '../components/dashboard/DashboardCharts';
import { dashboardService, settingsService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CHART_COLORS } from '../utils/constants';
import { formatDateTime, rupees } from '../utils/format';

function StatCard({ label, value, icon: Icon, tone }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] leading-tight font-medium tracking-wide text-slate-500 uppercase">{label}</p>
        <p className="font-display text-3xl leading-tight font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

/** Admin switch to open / close public player registration. */
function RegistrationToggle() {
  const toast = useToast();
  const [status, setStatus] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsService
      .getRegistration()
      .then((res) => setStatus(res.data))
      .catch((err) => toast.error(err.message));
  }, [toast]);

  const change = async () => {
    setSaving(true);
    try {
      const res = await settingsService.setRegistration(!status.open);
      setStatus(res.data);
      toast.success(res.message);
      setConfirmOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!status) return null;
  const { open } = status;

  return (
    <div className={`card flex flex-col gap-3 p-4 sm:flex-row sm:items-center ${open ? '' : 'border-red-200 bg-red-50'}`}>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${open ? 'bg-pitch-100 text-pitch-700' : 'bg-red-100 text-red-700'}`}>
        <UserPlus className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-slate-900">
          Player registration is{' '}
          <span className={open ? 'text-pitch-700' : 'text-ball-500'}>{open ? 'OPEN' : 'CLOSED'}</span>
        </p>
        <p className="text-sm text-slate-500">
          {open
            ? 'Players can register at /registerplayer.'
            : 'Players who open /registerplayer see "Registration is disabled. Please contact the admin."'}
          {status.updatedBy && ` Last changed by ${status.updatedBy.name} on ${formatDateTime(status.updatedAt)}.`}
        </p>
      </div>
      <button
        role="switch"
        aria-checked={open}
        onClick={() => setConfirmOpen(true)}
        className={open ? 'btn-danger' : 'btn-primary'}
      >
        {open ? 'Close registration' : 'Open registration'}
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title={open ? 'Close player registration?' : 'Open player registration?'}
        tone={open ? 'danger' : 'primary'}
        confirmLabel={open ? 'Yes, close' : 'Yes, open'}
        loading={saving}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={change}
        message={
          open
            ? 'New players will not be able to register until you open it again. Existing players are not affected.'
            : 'Players will be able to register again.'
        }
      />
    </div>
  );
}

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardService.summary();
      setData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const c = data?.cards;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={data ? `Updated ${formatDateTime(data.generatedAt)}` : 'Tournament overview'}
        onRefresh={load}
        refreshing={loading}
      />

      {error && !data ? (
        <ErrorState message={error} onRetry={load} />
      ) : !data ? (
        <Loader />
      ) : (
        <div className="space-y-5">
          {isAdmin && <RegistrationToggle />}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Total Registered" value={c.totalRegistered} icon={Users} tone="bg-sky-100 text-sky-700" />
            <StatCard label="Paid" value={c.paid} icon={BadgeCheck} tone="bg-pitch-100 text-pitch-700" />
            <StatCard label="Unpaid" value={c.unpaid} icon={Hourglass} tone="bg-amber-100 text-amber-700" />
            <StatCard label="Teams" value={c.totalTeams} icon={Shield} tone="bg-violet-100 text-violet-700" />
            <StatCard label="Sold" value={c.sold} icon={Gavel} tone="bg-red-100 text-red-700" />
            <StatCard label="Unsold (paid)" value={c.unsold} icon={CircleDollarSign} tone="bg-slate-200 text-slate-700" />
          </div>

          <ChartCard title={`Auction progress · Total spent ${rupees(c.totalSoldAmount)}`}>
            <AuctionProgress progress={data.auctionProgress} />
          </ChartCard>

          {isAdmin && (
            <ChartCard title="Registrations over time">
              <RegistrationsChart data={data.registrationsByDay} />
            </ChartCard>
          )}

          {/* 12-column grid: big chart 9 + donut 3 on each row */}
          <div className="grid gap-5 lg:grid-cols-12">
            <ChartCard title="Team-wise player distribution" className="lg:col-span-9">
              <TeamDistributionChart data={data.teamDistribution} />
            </ChartCard>
            <ChartCard title="Sold vs Unsold (paid players)" className="lg:col-span-3">
              <DonutChart data={data.soldVsUnsold} colors={[CHART_COLORS.sold, CHART_COLORS.unsold]} />
            </ChartCard>
            <ChartCard title="Team purse utilization" className="lg:col-span-9">
              <PurseChart data={data.purseUtilization} />
            </ChartCard>
            <ChartCard title="Paid vs Unpaid" className="lg:col-span-3">
              <DonutChart data={data.paidVsUnpaid} colors={[CHART_COLORS.paid, CHART_COLORS.unpaid]} />
            </ChartCard>
          </div>
        </div>
      )}
    </>
  );
}
