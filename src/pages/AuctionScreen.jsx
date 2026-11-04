import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Gavel,
  Loader2,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Square,
  Timer,
  X,
} from 'lucide-react';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { ErrorState } from '../components/common/Feedback';
import SaleForm from '../components/auction/SaleForm';
import EditSaleModal from '../components/auction/EditSaleModal';
import { auctionService, playerService, teamService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AUCTION_TIMER_SECONDS, styleMeta, TOURNAMENT_FULL_NAME } from '../utils/constants';
import { BrandLogo } from '../components/common/Avatar';
import { formatDate, imageUrl, rupees } from '../utils/format';

function Info({ label, children, big = false }) {
  return (
    <div className="border-b border-white/10 py-2.5 last:border-0">
      <p className="text-xs font-semibold tracking-[0.2em] text-pitch-300 uppercase">{label}</p>
      <p className={`${big ? 'text-2xl' : 'text-lg'} font-semibold text-white`}>{children}</p>
    </div>
  );
}

/** Short beep when the timer reaches zero (ignored if the browser blocks audio). */
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 880;
    gain.gain.value = 0.15;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
    osc.onended = () => ctx.close();
  } catch {
    /* audio not available */
  }
}

/**
 * Bid countdown for the auctioneer.
 * Start / Resume · Pause · Stop (back to full time, not running) · Reset (start again from full time).
 * Keyboard: Space = start / pause, R = reset (not while typing).
 */
function AuctionTimer({ seconds, resetKey, keysDisabled }) {
  const total = seconds * 1000;
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(false);
  const endAtRef = useRef(0);

  const start = useCallback(() => {
    const from = remaining <= 0 ? total : remaining;
    endAtRef.current = Date.now() + from;
    setRemaining(from);
    setRunning(true);
  }, [remaining, total]);

  const pause = useCallback(() => {
    setRemaining(Math.max(0, endAtRef.current - Date.now()));
    setRunning(false);
  }, []);

  const stop = useCallback(() => {
    setRunning(false);
    setRemaining(total);
  }, [total]);

  const reset = useCallback(() => {
    setRemaining(total);
    if (running) endAtRef.current = Date.now() + total;
  }, [running, total]);

  // A new player always starts with a fresh, stopped timer.
  useEffect(() => {
    setRunning(false);
    setRemaining(total);
  }, [resetKey, total]);

  useEffect(() => {
    if (!running) return undefined;
    const tick = setInterval(() => {
      const left = endAtRef.current - Date.now();
      if (left <= 0) {
        setRemaining(0);
        setRunning(false);
        beep();
      } else {
        setRemaining(left);
      }
    }, 100);
    return () => clearInterval(tick);
  }, [running]);

  const keysDisabledRef = useRef(keysDisabled);
  keysDisabledRef.current = keysDisabled;
  useEffect(() => {
    const onKey = (e) => {
      if (keysDisabledRef.current) return;
      if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(document.activeElement?.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (running) pause();
        else start();
      } else if (e.key === 'r' || e.key === 'R') reset();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [running, start, pause, reset]);

  const secs = Math.ceil(remaining / 1000);
  const timeUp = remaining <= 0;
  const paused = !running && remaining > 0 && remaining < total;
  const color = timeUp || secs <= 5 ? 'text-red-400' : secs <= 10 ? 'text-gold-400' : 'text-white';
  const barColor = timeUp || secs <= 5 ? 'bg-red-500' : secs <= 10 ? 'bg-gold-400' : 'bg-pitch-400';
  const btn =
    'flex items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-base font-bold transition active:scale-95 disabled:opacity-30';

  return (
    <div className="mt-6 rounded-2xl bg-black/30 p-5 ring-1 ring-white/10">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold tracking-[0.2em] text-pitch-200 uppercase">
          <Timer className="h-4 w-4" /> Bid Timer
        </p>
        <p className="text-xs font-semibold tracking-wider text-pitch-300 uppercase">
          {timeUp ? 'Time up' : running ? 'Running' : paused ? 'Paused' : 'Ready'}
        </p>
      </div>

      <p
        className={`text-center font-display leading-none font-extrabold tabular-nums ${color} ${
          running && secs <= 5 ? 'animate-pulse' : ''
        } ${timeUp ? 'text-7xl xl:text-8xl' : 'text-[7rem] xl:text-[9rem]'}`}
        aria-live="polite"
      >
        {timeUp ? 'TIME UP' : secs}
      </p>

      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-[width] duration-100 ${barColor}`}
          style={{ width: `${(remaining / total) * 100}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <button className={`${btn} bg-pitch-500 text-white hover:bg-pitch-400`} onClick={start} disabled={running}>
          <Play className="h-5 w-5" /> {paused ? 'Resume' : 'Start'}
        </button>
        <button className={`${btn} bg-gold-400 text-pitch-900 hover:bg-gold-300`} onClick={pause} disabled={!running}>
          <Pause className="h-5 w-5" /> Pause
        </button>
        <button
          className={`${btn} bg-ball-500 text-white hover:bg-ball-600`}
          onClick={stop}
          disabled={!running && remaining === total}
        >
          <Square className="h-5 w-5" /> Stop
        </button>
        <button
          className={`${btn} bg-white/15 text-white hover:bg-white/25`}
          onClick={reset}
          disabled={remaining === total}
        >
          <RotateCcw className="h-5 w-5" /> Reset
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-pitch-300">Space = start / pause · R = reset</p>
    </div>
  );
}

function SoldBanner({ sale, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-pitch-900/80 backdrop-blur-sm"
      onClick={onDone}
    >
      <div className="text-center">
        <div className="animate-sold inline-block rounded-3xl border-8 border-gold-400 bg-ball-500 px-14 py-6 shadow-2xl">
          <p className="font-display text-8xl font-extrabold tracking-[0.15em] text-white sm:text-9xl">SOLD!</p>
        </div>
        <p className="mt-8 font-display text-4xl font-bold text-white">
          {sale.slNo} · {sale.fullName}
        </p>
        <p className="mt-2 font-display text-5xl font-extrabold text-gold-400">
          {sale.team} · {rupees(sale.amount)}
        </p>
      </div>
    </div>
  );
}

/** Full-screen auction view for a projector. Selling / editing / undoing is Auctioneer-only. */
export default function AuctionScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuctioneer } = useAuth();
  const toast = useToast();

  const listQuery = location.state?.listQuery || '';
  const [player, setPlayer] = useState(null);
  const [teams, setTeams] = useState([]);
  const [ids, setIds] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState('');
  const [teamId, setTeamId] = useState('');
  const [formError, setFormError] = useState('');
  const [confirmSell, setConfirmSell] = useState(false);
  const [confirmUndo, setConfirmUndo] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [soldBanner, setSoldBanner] = useState(null);
  const hideBanner = useCallback(() => setSoldBanner(null), []);
  const dialogOpen = confirmSell || confirmUndo || editOpen;
  const dialogOpenRef = useRef(false);
  dialogOpenRef.current = dialogOpen;

  const loadPlayer = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [p, t] = await Promise.all([playerService.get(id), teamService.list()]);
      setPlayer(p.data);
      setTeams(t.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPlayer();
    setAmount('');
    setTeamId('');
    setFormError('');
  }, [loadPlayer]);

  // Ordered ids of the list the auctioneer came from (same filters) for Previous / Next.
  const loadIds = useCallback(() => {
    const params = Object.fromEntries(new URLSearchParams(listQuery));
    delete params.page;
    playerService
      .ids({ ...params, paymentStatus: 'Paid' })
      .then((res) => setIds(res.data))
      .catch(() => setIds([]));
  }, [listQuery]);

  useEffect(() => {
    loadIds();
  }, [loadIds]);

  const index = ids.indexOf(id);
  const prevId = index > 0 ? ids[index - 1] : null;
  const nextId = index >= 0 && index < ids.length - 1 ? ids[index + 1] : null;

  const goTo = useCallback(
    (targetId) => targetId && navigate(`/auction/${targetId}`, { replace: true, state: { listQuery } }),
    [navigate, listQuery],
  );
  const close = useCallback(
    () => navigate(`/app/paid-players${listQuery ? `?${listQuery}` : ''}`),
    [navigate, listQuery],
  );

  useEffect(() => {
    const onKey = (e) => {
      if (dialogOpenRef.current) return;
      const typing = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName);
      if (e.key === 'Escape') close();
      else if (!typing && e.key === 'ArrowLeft') goTo(prevId);
      else if (!typing && e.key === 'ArrowRight') goTo(nextId);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close, goTo, prevId, nextId]);

  const selectedTeam = useMemo(() => teams.find((t) => t._id === teamId), [teams, teamId]);

  const requestSell = () => {
    if (!(Number(amount) > 0)) return setFormError('Enter the sold amount');
    if (!teamId) return setFormError('Choose the team');
    if (Number(amount) > selectedTeam.remainingPurse) {
      return setFormError(`${selectedTeam.name} has only ${rupees(selectedTeam.remainingPurse)} remaining`);
    }
    setFormError('');
    setConfirmSell(true);
    return undefined;
  };

  const doSell = async () => {
    setBusy(true);
    try {
      await auctionService.sell(player._id, teamId, Number(amount));
      setConfirmSell(false);
      setSoldBanner({ slNo: player.slNo, fullName: player.fullName, team: selectedTeam.name, amount: Number(amount) });
      setAmount('');
      setTeamId('');
    } catch (err) {
      setConfirmSell(false);
      setFormError(err.message);
    } finally {
      setBusy(false);
      loadPlayer(); // always show the latest player + purses (the list order is kept so Next still works)
    }
  };

  const doUndo = async () => {
    setBusy(true);
    try {
      const res = await auctionService.undoSale(player._id);
      toast.success(res.message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setConfirmUndo(false);
      setBusy(false);
      loadPlayer();
    }
  };

  const style = player ? styleMeta(player.cricketStyle) : null;
  const sold = player?.soldStatus === 'Sold';

  return (
    <div className="min-h-screen bg-pitch-900 text-white lg:h-screen lg:overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <BrandLogo className="h-9 w-9" />
          <span className="font-display text-lg font-bold tracking-wide uppercase">
            {TOURNAMENT_FULL_NAME} <span className="text-gold-400">· Live Auction</span>
          </span>
          {ids.length > 0 && index >= 0 && (
            <span className="ml-2 rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-pitch-200">
              {index + 1} / {ids.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20 disabled:opacity-30"
            onClick={() => goTo(prevId)}
            disabled={!prevId}
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <button
            className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20 disabled:opacity-30"
            onClick={() => goTo(nextId)}
            disabled={!nextId}
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
          <button
            className="flex items-center gap-1 rounded-lg bg-ball-500 px-3 py-2 text-sm font-semibold hover:bg-ball-600"
            onClick={close}
            title="Close (Esc)"
          >
            <X className="h-4 w-4" /> Close
          </button>
        </div>
      </div>

      {error ? (
        <div className="mx-auto max-w-md pt-20 [&_p]:text-white">
          <ErrorState message={error} onRetry={loadPlayer} />
        </div>
      ) : !player ? (
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-gold-400" />
        </div>
      ) : (
        <div className={`flex flex-col lg:h-[calc(100vh-57px)] lg:flex-row ${loading ? 'opacity-70' : ''}`}>
          {/* Left 60%: photo */}
          <div className="relative flex items-center justify-center bg-black/30 p-4 lg:w-3/5 lg:p-8">
            <img
              src={imageUrl(player.photoUrl)}
              alt={player.fullName}
              className="max-h-[60vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl ring-4 ring-white/10 lg:max-h-full"
            />
            {sold && (
              <div className="absolute top-6 right-6 rotate-[-8deg] rounded-xl border-4 border-gold-400 bg-ball-500 px-6 py-2 shadow-xl">
                <span className="font-display text-4xl font-extrabold tracking-widest">SOLD</span>
              </div>
            )}
          </div>

          {/* Right 40%: details + sell */}
          <div className="flex flex-col overflow-y-auto p-5 lg:w-2/5 lg:p-8">
            <p className="font-display text-6xl leading-none font-extrabold tracking-wider text-gold-400 xl:text-7xl">
              {player.slNo}
            </p>
            <h1 className="mt-2 font-display text-4xl leading-tight font-bold xl:text-5xl">{player.fullName}</h1>
            <p className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xl font-semibold">
              <span aria-hidden>{style.emoji}</span> {player.cricketStyle}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-x-6">
              <Info label="Mobile">{player.mobile}</Info>
              <Info label="Registered">{formatDate(player.registrationDate)}</Info>
              <Info label="Payment">
                <span className="text-pitch-300">● {player.paymentStatus}</span>
              </Info>
              <Info label="Status">
                <span className={sold ? 'text-red-300' : 'text-slate-300'}>{sold ? 'Sold' : 'Not Sold'}</span>
              </Info>
            </div>

            {sold ? (
              <div className="mt-6 rounded-2xl border-2 border-gold-400/60 bg-gold-400/10 p-5">
                <p className="text-sm font-semibold tracking-[0.2em] text-gold-300 uppercase">Sold to</p>
                <p className="font-display text-4xl font-bold">{player.team?.name}</p>
                <p className="font-display text-5xl font-extrabold text-gold-400">{rupees(player.soldAmount)}</p>
                {isAuctioneer && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="flex items-center gap-1.5 rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/25"
                      onClick={() => setEditOpen(true)}
                    >
                      <Pencil className="h-4 w-4" /> Edit sale
                    </button>
                    <button
                      className="flex items-center gap-1.5 rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/25"
                      onClick={() => setConfirmUndo(true)}
                    >
                      <RotateCcw className="h-4 w-4" /> Undo sale
                    </button>
                  </div>
                )}
              </div>
            ) : isAuctioneer ? (
              <>
                <AuctionTimer seconds={AUCTION_TIMER_SECONDS} resetKey={player._id} keysDisabled={dialogOpen} />
                <div className="mt-6 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                  <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-bold tracking-wider uppercase">
                    <Gavel className="h-6 w-6 text-gold-400" /> Sell Player
                  </h2>
                  <SaleForm
                    amount={amount}
                    setAmount={setAmount}
                    teamId={teamId}
                    setTeamId={setTeamId}
                    teams={teams}
                    dark
                  />
                  {formError && (
                    <p className="mt-3 rounded-lg bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-200">
                      {formError}
                    </p>
                  )}
                  <button
                    onClick={requestSell}
                    disabled={busy}
                    className="mt-5 flex h-16 w-full items-center justify-center gap-3 rounded-xl bg-gold-400 font-display text-3xl font-extrabold tracking-widest text-pitch-900 uppercase shadow-lg transition hover:bg-gold-300 active:scale-[0.98] disabled:opacity-60"
                  >
                    <Gavel className="h-7 w-7" /> Sell
                  </button>
                </div>
              </>
            ) : (
              <p className="mt-6 rounded-xl bg-white/5 px-4 py-3 text-sm text-pitch-200 ring-1 ring-white/10">
                View only. Only the auctioneer can sell this player.
              </p>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmSell}
        title="Confirm sale"
        tone="gold"
        confirmLabel="Yes, SELL"
        loading={busy}
        onCancel={() => setConfirmSell(false)}
        onConfirm={doSell}
        message={
          player &&
          selectedTeam && (
            <p className="text-base">
              Sell <b>{player.slNo}</b> <b>{player.fullName}</b> to <b>{selectedTeam.name}</b> for{' '}
              <b>{rupees(amount)}</b>?
            </p>
          )
        }
      />
      <ConfirmDialog
        open={confirmUndo}
        title="Undo this sale?"
        tone="danger"
        confirmLabel="Yes, undo sale"
        loading={busy}
        onCancel={() => setConfirmUndo(false)}
        onConfirm={doUndo}
        message={
          player && (
            <p>
              <b>{player.slNo}</b> goes back to <b>Not Sold</b> and <b>{rupees(player.soldAmount)}</b> is returned to{' '}
              <b>{player.team?.name}</b>.
            </p>
          )
        }
      />
      <EditSaleModal
        open={editOpen}
        player={player}
        teams={teams}
        onClose={() => setEditOpen(false)}
        onSaved={loadPlayer}
      />
      {soldBanner && <SoldBanner sale={soldBanner} onDone={hideBanner} />}
    </div>
  );
}
