import { rupees } from '../../utils/format';

const INCREMENTS = [1000, 5000, 10000, 50000];

/** Sold amount + team picker. Each team option shows its remaining purse. */
export default function SaleForm({ amount, setAmount, teamId, setTeamId, teams, dark = false, extraPurse = null }) {
  const inputCls = dark
    ? 'w-full rounded-xl border-2 border-white/15 bg-white/10 px-4 py-3 text-2xl font-bold text-white placeholder:text-white/40 focus:border-gold-400 focus:outline-none'
    : 'input text-lg font-semibold';
  const labelCls = dark ? 'mb-1.5 block text-sm font-semibold tracking-wide text-pitch-200 uppercase' : 'label';

  // When editing a sale, the player's current team gets its current amount back first.
  const available = (t) => t.remainingPurse + (extraPurse && extraPurse.teamId === t._id ? extraPurse.amount : 0);
  const selected = teams.find((t) => t._id === teamId);
  const over = selected && Number(amount) > available(selected);

  return (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>Sold Amount (₹)</label>
        <input
          className={inputCls}
          type="number"
          inputMode="numeric"
          min="1"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {INCREMENTS.map((inc) => (
            <button
              type="button"
              key={inc}
              onClick={() => setAmount(String((Number(amount) || 0) + inc))}
              className={
                dark
                  ? 'rounded-md bg-white/10 px-2.5 py-1 text-xs font-semibold text-pitch-100 hover:bg-white/20'
                  : 'rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200'
              }
            >
              +{rupees(inc)}
            </button>
          ))}
          {amount && (
            <button
              type="button"
              onClick={() => setAmount('')}
              className={dark ? 'px-2 text-xs text-pitch-300 underline' : 'px-2 text-xs text-slate-500 underline'}
            >
              clear
            </button>
          )}
        </div>
      </div>
      <div>
        <label className={labelCls}>Team</label>
        <select className={dark ? `${inputCls} text-lg [&>option]:text-slate-900` : 'input'} value={teamId} onChange={(e) => setTeamId(e.target.value)}>
          <option value="">Select team…</option>
          {teams.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name} — {rupees(available(t))} left
            </option>
          ))}
        </select>
        {over && (
          <p className={`mt-1.5 text-sm font-semibold ${dark ? 'text-red-300' : 'text-ball-500'}`}>
            {selected.name} has only {rupees(available(selected))} remaining
          </p>
        )}
      </div>
    </div>
  );
}
