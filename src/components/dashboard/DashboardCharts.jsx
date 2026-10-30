import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_COLORS } from '../../utils/constants';
import { rupees } from '../../utils/format';

const axis = { fontSize: 12, fill: '#64748b' };
const shortRupees = (v) => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`);

export function ChartCard({ title, children, className = '' }) {
  return (
    <div className={`card p-4 ${className}`}>
      <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
      {children}
    </div>
  );
}

function NoData() {
  return <div className="flex h-56 items-center justify-center text-sm text-slate-400">No data yet</div>;
}

export function DonutChart({ data, colors }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <NoData />;
  return (
    <div className="relative h-60">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={data.filter((d) => d.value > 0).length > 1 ? 2 : 0} stroke="none">
            {data.map((d, i) => (
              <Cell key={d.name} fill={colors[i]} />
            ))}
          </Pie>
          <Tooltip formatter={(v, n) => [`${v} (${Math.round((v / total) * 100)}%)`, n]} />
          <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 13 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-x-0 top-[38%] text-center">
        <p className="font-display text-3xl font-bold text-slate-800">{total}</p>
        <p className="text-xs text-slate-500">total</p>
      </div>
    </div>
  );
}

export function RegistrationsChart({ data }) {
  if (!data.length) return <NoData />;
  return (
    <div className="h-60">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="regFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.line} stopOpacity={0.35} />
              <stop offset="100%" stopColor={CHART_COLORS.line} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="date"
            tick={axis}
            tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          />
          <YAxis allowDecimals={false} tick={axis} />
          <Tooltip labelFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium' })} />
          <Area type="monotone" dataKey="count" name="Registrations" stroke={CHART_COLORS.line} strokeWidth={2} fill="url(#regFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TeamDistributionChart({ data }) {
  if (!data.length) return <NoData />;
  return (
    <div className="h-64">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="team" tick={axis} interval={0} angle={data.length > 5 ? -25 : 0} textAnchor={data.length > 5 ? 'end' : 'middle'} height={data.length > 5 ? 60 : 30} />
          <YAxis allowDecimals={false} tick={axis} />
          <Tooltip />
          <Bar dataKey="players" name="Players" fill={CHART_COLORS.bar} radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PurseChart({ data }) {
  if (!data.length) return <NoData />;
  return (
    <div className="h-64">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="team" tick={axis} interval={0} angle={data.length > 5 ? -25 : 0} textAnchor={data.length > 5 ? 'end' : 'middle'} height={data.length > 5 ? 60 : 30} />
          <YAxis tick={axis} tickFormatter={shortRupees} />
          <Tooltip formatter={(v) => rupees(v)} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
          <Bar dataKey="spent" name="Spent" stackId="purse" fill={CHART_COLORS.spent} maxBarSize={48} />
          <Bar dataKey="remaining" name="Remaining" stackId="purse" fill={CHART_COLORS.remaining} radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AuctionProgress({ progress }) {
  const { sold, totalPaid, percent } = progress;
  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <p className="font-display text-4xl font-bold text-pitch-800">{percent}%</p>
        <p className="text-sm text-slate-500">
          <b className="text-slate-700">{sold}</b> sold of <b className="text-slate-700">{totalPaid}</b> paid players
        </p>
      </div>
      <div className="h-4 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-pitch-600 to-pitch-400 transition-all duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
