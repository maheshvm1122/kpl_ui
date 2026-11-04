import { useCallback, useEffect, useState } from 'react';
import { FileSpreadsheet, Loader2, Pencil, Phone, Plus, Shield, Trash2, User } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Avatar from '../components/common/Avatar';
import SearchInput from '../components/common/SearchInput';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { EmptyState, ErrorState, Loader } from '../components/common/Feedback';
import TeamFormModal from '../components/teams/TeamFormModal';
import { excelService, teamService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useDebounce from '../hooks/useDebounce';
import { rupees } from '../utils/format';

export default function TeamsPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [teams, setTeams] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [formOpen, setFormOpen] = useState(false);
  const [editTeam, setEditTeam] = useState(null);
  const [deleteTeam, setDeleteTeam] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await teamService.list({ search: debounced });
      setTeams(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [debounced]);

  useEffect(() => {
    load();
  }, [load]);

  const exportExcel = async () => {
    setExporting(true);
    try {
      await excelService.teams({ search: debounced });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  const openCreate = () => {
    setEditTeam(null);
    setFormOpen(true);
  };
  const openEdit = (team) => {
    setEditTeam(team);
    setFormOpen(true);
  };

  const doDelete = async () => {
    setDeleting(true);
    try {
      const res = await teamService.remove(deleteTeam._id);
      toast.success(res.message);
      setDeleteTeam(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Teams"
        subtitle={teams ? `${teams.length} team(s)` : 'Tournament teams'}
        onRefresh={load}
        refreshing={loading}
        actions={
          <>
            <button className="btn-secondary" onClick={exportExcel} disabled={exporting || !teams?.length}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              Download Excel
            </button>
            {isAdmin && (
              <button className="btn-primary" onClick={openCreate}>
                <Plus className="h-4 w-4" /> New team
              </button>
            )}
          </>
        }
      />

      <SearchInput className="mb-4 sm:w-72" value={search} onChange={setSearch} placeholder="Search team name" />

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !teams ? (
        <Loader />
      ) : teams.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Shield}
            title="No teams yet"
            message={
              isAdmin ? 'Create the teams that will take part in the auction.' : 'The admin has not added teams yet.'
            }
            action={
              isAdmin && (
                <button className="btn-primary" onClick={openCreate}>
                  <Plus className="h-4 w-4" /> New team
                </button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((t) => {
            const pct = t.totalPurse ? Math.round((t.spentAmount / t.totalPurse) * 100) : 0;
            return (
              <div key={t._id} className="card p-4">
                <div className="flex items-start gap-3">
                  <Avatar src={t.logoUrl} name={t.name} size="md" rounded="rounded-full" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-semibold text-slate-900">{t.name}</p>
                    <p className="flex items-center gap-1 text-sm text-slate-500">
                      <User className="h-3.5 w-3.5" /> {t.ownerName || '—'}
                      {t.ownerMobile && (
                        <>
                          <Phone className="ml-2 h-3.5 w-3.5" /> {t.ownerMobile}
                        </>
                      )}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button className="btn-ghost btn-sm" onClick={() => openEdit(t)} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        className="btn-ghost btn-sm text-ball-500"
                        onClick={() => setDeleteTeam(t)}
                        disabled={t.playersCount > 0}
                        title={t.playersCount > 0 ? 'Teams with purchased players cannot be deleted' : 'Delete'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-slate-50 py-2">
                    <p className="text-xs text-slate-500">Total purse</p>
                    <p className="font-semibold">{rupees(t.totalPurse)}</p>
                  </div>
                  <div className="rounded-lg bg-pitch-50 py-2">
                    <p className="text-xs text-slate-500">Remaining</p>
                    <p className="font-semibold text-pitch-700">{rupees(t.remainingPurse)}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 py-2">
                    <p className="text-xs text-slate-500">Players</p>
                    <p className="font-semibold">{t.playersCount}</p>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-ball-500" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {pct}% used · spent {rupees(t.spentAmount)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <TeamFormModal open={formOpen} team={editTeam} onClose={() => setFormOpen(false)} onSaved={load} />
      <ConfirmDialog
        open={Boolean(deleteTeam)}
        title="Delete team?"
        tone="danger"
        confirmLabel="Delete"
        loading={deleting}
        onCancel={() => setDeleteTeam(null)}
        onConfirm={doDelete}
        message={
          deleteTeam && (
            <>
              This will permanently delete <b>{deleteTeam.name}</b>.
            </>
          )
        }
      />
    </>
  );
}
