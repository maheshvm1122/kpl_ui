import { ArrowDownUp } from 'lucide-react';
import SearchInput from '../common/SearchInput';
import { CRICKET_STYLES } from '../../utils/constants';

/** Shared filter bar. Pass `show` to choose which filters appear. */
export default function PlayerFilters({ query, setQuery, teams = [], show = {}, searchPlaceholder }) {
  return (
    <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
      <SearchInput
        className="sm:col-span-2 lg:w-72"
        value={query.search}
        onChange={(v) => setQuery({ search: v })}
        placeholder={searchPlaceholder || 'Search S.L. No, name or mobile'}
      />
      {show.payment && (
        <select className="input lg:w-40" value={query.paymentStatus} onChange={(e) => setQuery({ paymentStatus: e.target.value })}>
          <option value="">All payments</option>
          <option value="Paid">Paid</option>
          <option value="Unpaid">Unpaid</option>
        </select>
      )}
      {show.sold && (
        <select className="input lg:w-40" value={query.soldStatus} onChange={(e) => setQuery({ soldStatus: e.target.value })}>
          <option value="">Sold & not sold</option>
          <option value="Sold">Sold</option>
          <option value="NotSold">Not sold</option>
        </select>
      )}
      <select className="input lg:w-44" value={query.cricketStyle} onChange={(e) => setQuery({ cricketStyle: e.target.value })}>
        <option value="">All styles</option>
        {CRICKET_STYLES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.emoji} {s.label}
          </option>
        ))}
      </select>
      {show.team && (
        <select className="input lg:w-44" value={query.team} onChange={(e) => setQuery({ team: e.target.value })}>
          <option value="">All teams</option>
          {teams.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>
      )}
      <div className="flex gap-2 lg:ml-auto">
        <select className="input lg:w-44" value={query.sortBy} onChange={(e) => setQuery({ sortBy: e.target.value })}>
          <option value="slNo">Sort: S.L. No</option>
          <option value="name">Sort: Name</option>
          <option value="registrationDate">Sort: Registration date</option>
        </select>
        <button
          className="btn-secondary shrink-0 px-3"
          title="Toggle sort order"
          onClick={() => setQuery({ sortOrder: query.sortOrder === 'asc' ? 'desc' : 'asc' })}
        >
          <ArrowDownUp className="h-4 w-4" /> {query.sortOrder === 'asc' ? 'Asc' : 'Desc'}
        </button>
      </div>
    </div>
  );
}
