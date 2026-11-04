import api, { exportToExcel, toFormData } from './api';
import { formatDateTime } from '../utils/format';

const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null));

export const publicService = {
  getConfig: () => api.get('/public/config'),
  register: (values, onUploadProgress) =>
    api.post('/public/register', toFormData(values), { onUploadProgress, timeout: 120000 }),
};

export const settingsService = {
  getRegistration: () => api.get('/settings/registration'),
  setRegistration: (open) => api.patch('/settings/registration', { open }),
};

export const authService = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
};

export const dashboardService = {
  summary: () => api.get('/dashboard'),
};

export const playerService = {
  list: (params) => api.get('/players', { params: clean(params) }),
  ids: (params) => api.get('/players/ids', { params: clean(params) }),
  get: (id) => api.get(`/players/${id}`),
  update: (id, values) => api.put(`/players/${id}`, toFormData(values)),
  setPayment: (id, status) => api.patch(`/players/${id}/payment`, { status }),
  archive: (id) => api.patch(`/players/${id}/archive`),
  unarchive: (id) => api.patch(`/players/${id}/unarchive`),
  bulkPayment: (ids, status = 'Paid') => api.patch('/players/payment/bulk', { ids, status }),
};

export const teamService = {
  list: (params) => api.get('/teams', { params: clean(params) }),
  stats: (params) => api.get('/teams/stats', { params: clean(params) }),
  get: (id) => api.get(`/teams/${id}`),
  create: (values) => api.post('/teams', toFormData(values)),
  update: (id, values) => api.put(`/teams/${id}`, toFormData(values)),
  remove: (id) => api.delete(`/teams/${id}`),
};

export const userService = {
  list: (params) => api.get('/users', { params: clean(params) }),
  create: (values) => api.post('/users', values),
  update: (id, values) => api.put(`/users/${id}`, values),
  resetPassword: (id, password) => api.patch(`/users/${id}/password`, { password }),
  setStatus: (id, status) => api.patch(`/users/${id}/status`, { status }),
};

export const auditService = {
  list: (params) => api.get('/audit-logs', { params: clean(params) }),
};

export const auctionService = {
  sell: (playerId, teamId, amount) => api.post('/auction/sell', { playerId, teamId, amount }),
  editSale: (playerId, teamId, amount) => api.put(`/auction/sales/${playerId}`, { teamId, amount }),
  undoSale: (playerId) => api.post(`/auction/sales/${playerId}/undo`),
};

// Dates go into Excel as readable text (e.g. "29 Oct 2026, 11:46 am") so every spreadsheet app shows them correctly.
const toDate = (value) => (value ? formatDateTime(value) : '');
const MAX_LIMIT = 300;

/** Fetches every player matching the filters, 300 at a time. */
async function listAllPlayers(params) {
  const items = [];
  for (let page = 1; ; page += 1) {
    const res = await playerService.list({ ...params, page, limit: MAX_LIMIT });
    items.push(...res.data.items);
    if (page >= res.data.totalPages) return items;
  }
}

/**
 * One Excel file for teams: a "Summary" sheet with every team, then one sheet per team
 * (named after the team) listing its purchased players with a total row.
 */
const exportTeamsWorkbook = (teams, fileName) =>
  exportToExcel({
    fileName,
    sheets: [
      {
        sheetName: 'Summary',
        columns: [
          { header: 'Team Name', key: 'name', width: 26 },
          { header: 'Owner Name', key: 'ownerName', width: 22 },
          { header: 'Owner Mobile', key: 'ownerMobile', width: 14 },
          { header: 'Total Purse (₹)', key: 'totalPurse', width: 16, type: 'money' },
          { header: 'Spent (₹)', key: 'spentAmount', width: 14, type: 'money' },
          { header: 'Remaining Purse (₹)', key: 'remainingPurse', width: 18, type: 'money' },
          { header: 'Players Purchased', key: 'playersCount', width: 16 },
        ],
        rows: teams,
      },
      ...teams.map((t) => ({
        sheetName: t.name,
        columns: [
          { header: 'Team', key: 'team', width: 26 },
          { header: 'S.L. No', key: 'slNo', width: 12 },
          { header: 'Player Name', key: 'fullName', width: 28 },
          { header: 'Cricket Style', key: 'cricketStyle', width: 16 },
          { header: 'Sold Amount (₹)', key: 'soldAmount', width: 16, type: 'money' },
        ],
        rows: t.players.length
          ? [
              ...t.players.map((p) => ({
                team: t.name,
                slNo: p.slNo,
                fullName: p.fullName,
                cricketStyle: p.cricketStyle,
                soldAmount: p.soldAmount,
              })),
              {
                team: t.name,
                fullName: `Total spent (${t.players.length} players)`,
                soldAmount: t.spentAmount,
                isTotal: true,
              },
              { team: t.name, fullName: 'Remaining purse', soldAmount: t.remainingPurse, isTotal: true },
            ]
          : [{ team: t.name, fullName: 'No players purchased yet' }],
      })),
    ],
  });

/** Excel downloads for each table. They use the same API calls as the screens. */
export const excelService = {
  players: async (params, fileName = 'players') => {
    const players = await listAllPlayers({ ...params, page: undefined, limit: undefined });
    await exportToExcel({
      fileName,
      sheetName: 'Players',
      columns: [
        { header: 'S.L. No', key: 'slNo', width: 12 },
        { header: 'Name', key: 'fullName', width: 28 },
        { header: 'Mobile', key: 'mobile', width: 14 },
        { header: 'Cricket Style', key: 'cricketStyle', width: 16 },
        { header: 'Registration Date', key: 'registrationDate', width: 20 },
        { header: 'Payment Status', key: 'paymentStatus', width: 15 },
        { header: 'Payment Updated At', key: 'paymentUpdatedAt', width: 20 },
        { header: 'Sold Status', key: 'soldStatus', width: 12 },
        { header: 'Team', key: 'team', width: 24 },
        { header: 'Sold Amount (₹)', key: 'soldAmount', width: 16, type: 'money' },
      ],
      rows: players.map((p) => ({
        ...p,
        registrationDate: toDate(p.registrationDate),
        paymentUpdatedAt: toDate(p.paymentUpdatedAt),
        soldStatus: p.soldStatus === 'Sold' ? 'Sold' : 'Not Sold',
        team: p.team?.name || '',
        soldAmount: p.soldStatus === 'Sold' ? p.soldAmount : null,
      })),
    });
  },

  /** Teams page: same workbook as Team Statistics (Summary + one sheet per team). */
  teams: async (params) => {
    const res = await teamService.stats(params);
    await exportTeamsWorkbook(res.data, 'teams');
  },

  teamStats: (teams) => exportTeamsWorkbook(teams, 'team-statistics'),

  auditLogs: async (params) => {
    const items = [];
    for (let page = 1; ; page += 1) {
      const res = await auditService.list({ ...params, page, limit: MAX_LIMIT });
      items.push(...res.data.items);
      if (page >= res.data.totalPages) break;
    }
    await exportToExcel({
      fileName: 'audit-logs',
      sheetName: 'Audit Logs',
      columns: [
        { header: 'Date & Time', key: 'createdAt', width: 22 },
        { header: 'Who', key: 'actorName', width: 24 },
        { header: 'Role', key: 'actorRole', width: 12 },
        { header: 'Category', key: 'category', width: 14 },
        { header: 'Activity', key: 'message', width: 80 },
        { header: 'IP Address', key: 'ip', width: 16 },
      ],
      rows: items.map((l) => ({ ...l, createdAt: toDate(l.createdAt) })),
    });
  },

  users: (users) =>
    exportToExcel({
      fileName: 'users',
      sheetName: 'Users',
      columns: [
        { header: 'Name', key: 'name', width: 24 },
        { header: 'Username', key: 'username', width: 18 },
        { header: 'Email', key: 'email', width: 28 },
        { header: 'Mobile', key: 'mobile', width: 14 },
        { header: 'Role', key: 'role', width: 14 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Created At', key: 'createdAt', width: 20 },
      ],
      rows: users.map((u) => ({ ...u, createdAt: toDate(u.createdAt) })),
    }),
};
