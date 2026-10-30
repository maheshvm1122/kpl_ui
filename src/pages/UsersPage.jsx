import { useCallback, useEffect, useState } from 'react';
import { FileSpreadsheet, KeyRound, Loader2, Pencil, Plus, UserCheck, UserX } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import SearchInput from '../components/common/SearchInput';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { EmptyState, ErrorState, Loader } from '../components/common/Feedback';
import { RoleBadge, UserStatusBadge } from '../components/common/Badges';
import UserFormModal from '../components/users/UserFormModal';
import ResetPasswordModal from '../components/users/ResetPasswordModal';
import { excelService, userService } from '../services';
import Pagination from '../components/common/Pagination';
import { PAGE_SIZE } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useDebounce from '../hooks/useDebounce';

export default function UsersPage() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const debounced = useDebounce(search);
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await userService.list({ search: debounced, role });
      setUsers(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [debounced, role]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => setPage(1), [debounced, role, limit]);

  // Users are few, so they are paged here in the browser.
  const totalPages = users ? Math.max(1, Math.ceil(users.length / limit)) : 1;
  const pageUsers = users ? users.slice((page - 1) * limit, page * limit) : [];

  const exportExcel = async () => {
    setExporting(true);
    try {
      await excelService.users(users);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  const changeStatus = async () => {
    setStatusLoading(true);
    try {
      const next = statusTarget.status === 'Active' ? 'Inactive' : 'Active';
      const res = await userService.setStatus(statusTarget._id, next);
      toast.success(res.message);
      setStatusTarget(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Admins and auctioneers who can log in"
        onRefresh={load}
        refreshing={loading}
        actions={
          <>
            <button className="btn-secondary" onClick={exportExcel} disabled={exporting || !users?.length}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              Download Excel
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                setEditUser(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> New user
            </button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchInput
          className="sm:w-72"
          value={search}
          onChange={setSearch}
          placeholder="Search name, username, email"
        />
        <select className="input sm:w-44" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="Admin">Admin</option>
          <option value="Auctioneer">Auctioneer</option>
        </select>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !users ? (
        <Loader />
      ) : users.length === 0 ? (
        <div className="card">
          <EmptyState title="No users found" />
        </div>
      ) : (
        <div className={`table-wrap ${loading ? 'opacity-60' : ''}`}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Role</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageUsers.map((u) => {
                const isMe = u._id === me._id;
                return (
                  <tr key={u._id} className="hover:bg-slate-50">
                    <td className="font-medium whitespace-nowrap">
                      {u.name} {isMe && <span className="text-xs text-slate-400">(you)</span>}
                    </td>
                    <td>@{u.username}</td>
                    <td>{u.email || '—'}</td>
                    <td>{u.mobile || '—'}</td>
                    <td>
                      <RoleBadge role={u.role} />
                    </td>
                    <td>
                      <UserStatusBadge status={u.status} />
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button
                          className="btn-ghost btn-sm"
                          title="Edit"
                          onClick={() => {
                            setEditUser(u);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button className="btn-ghost btn-sm" title="Reset password" onClick={() => setResetUser(u)}>
                          <KeyRound className="h-4 w-4" />
                        </button>
                        {u.status === 'Active' ? (
                          <button
                            className="btn-secondary btn-sm"
                            disabled={isMe}
                            title={isMe ? 'You cannot deactivate yourself' : ''}
                            onClick={() => setStatusTarget(u)}
                          >
                            <UserX className="h-4 w-4" /> Deactivate
                          </button>
                        ) : (
                          <button className="btn-primary btn-sm" onClick={() => setStatusTarget(u)}>
                            <UserCheck className="h-4 w-4" /> Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {users?.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={users.length}
          limit={limit}
          onChange={setPage}
          onLimitChange={setLimit}
        />
      )}

      <UserFormModal open={formOpen} user={editUser} onClose={() => setFormOpen(false)} onSaved={load} />
      <ResetPasswordModal open={Boolean(resetUser)} user={resetUser} onClose={() => setResetUser(null)} />
      <ConfirmDialog
        open={Boolean(statusTarget)}
        title={statusTarget?.status === 'Active' ? 'Deactivate user?' : 'Activate user?'}
        tone={statusTarget?.status === 'Active' ? 'danger' : 'primary'}
        confirmLabel={statusTarget?.status === 'Active' ? 'Deactivate' : 'Activate'}
        loading={statusLoading}
        onCancel={() => setStatusTarget(null)}
        onConfirm={changeStatus}
        message={
          statusTarget &&
          (statusTarget.status === 'Active' ? (
            <>
              <b>{statusTarget.username}</b> will be logged out and will not be able to log in.
            </>
          ) : (
            <>
              <b>{statusTarget.username}</b> will be able to log in again.
            </>
          ))
        }
      />
    </>
  );
}
