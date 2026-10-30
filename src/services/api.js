import axios from 'axios';

export const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'cricket_auth_token';

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

const api = axios.create({ baseURL: `${API_ORIGIN}/api`, timeout: 30000 });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data || {};
    let message = data.message;
    if (!message) {
      if (error.code === 'ECONNABORTED')
        message = 'The request took too long. Please check your internet and try again';
      else if (!error.response) message = 'Cannot reach the server. Please check your internet connection';
      else message = 'Something went wrong. Please try again';
    }
    if (status === 401 && tokenStore.get() && onUnauthorized) onUnauthorized(message);

    const err = new Error(message);
    err.status = status;
    err.details = data.details;
    return Promise.reject(err);
  },
);

export const toFormData = (values) => {
  const form = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    form.append(key, value);
  });
  return form;
};

/** Saves a downloaded file (Blob) on the user's device. */
export const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

const EXCEL_FORMATS = { money: '#,##0' };

/**
 * Builds an .xlsx file in the browser and downloads it.
 * columns: [{ header, key, width, type: 'money' }]
 * Each header cell is styled on its own so every column title is visible.
 */
export const exportToExcel = async ({ fileName, sheetName, columns, rows }) => {
  const { default: ExcelJS } = await import('exceljs'); // loaded only when someone exports
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(sheetName, { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = columns.map(({ key, width }) => ({ key, width: width || 16 }));

  const headerRow = sheet.addRow(columns.map((c) => c.header));
  headerRow.height = 20;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F5132' } };
    cell.alignment = { vertical: 'middle' };
  });

  rows.forEach((row) => {
    const added = sheet.addRow(columns.map((c) => row[c.key] ?? null));
    columns.forEach((c, i) => {
      if (EXCEL_FORMATS[c.type]) added.getCell(i + 1).numFmt = EXCEL_FORMATS[c.type];
    });
  });
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, `${fileName}-${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export default api;
