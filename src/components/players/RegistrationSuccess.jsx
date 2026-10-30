import { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toBlob } from 'html-to-image';
import { Camera, Check, CheckCircle2, Copy, Download, Loader2, Smartphone, UserPlus } from 'lucide-react';
import { buildUpiLink, formatDate, imageUrl } from '../../utils/format';
import { styleMeta } from '../../utils/constants';

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  }
}

const SAVED_KEY = 'cricket_card_saved_';
const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** Renders the card element to a PNG file. Retries without web fonts if they cannot be embedded. */
async function cardToFile(node, fileName) {
  const options = { pixelRatio: 2, cacheBust: true, backgroundColor: '#ffffff' };
  let blob;
  try {
    blob = await toBlob(node, options);
  } catch {
    blob = await toBlob(node, { ...options, skipFonts: true });
  }
  if (!blob) throw new Error('Could not create image');
  return new File([blob], fileName, { type: 'image/png' });
}

function downloadFile(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
      <span className="text-base text-slate-500">{label}</span>
      <span className="text-right text-lg font-bold text-slate-800">{children}</span>
    </div>
  );
}

export default function RegistrationSuccess({ data, onRegisterAnother }) {
  const { player, payment } = data;
  const [copied, setCopied] = useState(false);
  const [photoReady, setPhotoReady] = useState(false);
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error
  const cardRef = useRef(null);
  const style = styleMeta(player.cricketStyle);
  const fileName = `${player.slNo}-registration.png`;

  /** Saves the card as an image. `fromTap` = started by the user (needed for the iPhone share sheet). */
  const saveCard = useCallback(
    async (fromTap = false) => {
      if (!cardRef.current) return;
      setSaveState('saving');
      try {
        const file = await cardToFile(cardRef.current, fileName);
        if (fromTap && isIOS() && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: `${player.slNo} registration` });
        } else {
          downloadFile(file);
        }
        setSaveState('saved');
        try {
          sessionStorage.setItem(SAVED_KEY + player.slNo, '1');
        } catch {
          /* storage unavailable */
        }
      } catch (err) {
        setSaveState(err?.name === 'AbortError' ? 'idle' : 'error');
      }
    },
    [fileName, player.slNo]
  );

  // Save automatically once, after the photo has loaded. iPhones need a tap, so they use the button.
  useEffect(() => {
    if (!photoReady || isIOS()) return;
    let alreadySaved = false;
    try {
      alreadySaved = sessionStorage.getItem(SAVED_KEY + player.slNo) === '1';
    } catch {
      /* storage unavailable */
    }
    if (!alreadySaved) saveCard(false);
  }, [photoReady, player.slNo, saveCard]);

  const upiLink = payment.upiId
    ? buildUpiLink({
        upiId: payment.upiId,
        payeeName: payment.payeeName,
        amount: payment.amount,
        note: `${player.slNo} ${player.fullName}`.slice(0, 50),
      })
    : '';

  const onCopy = async () => {
    if (await copyText(payment.upiId)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pitch-800 to-pitch-50 px-4 pt-6 pb-12">
      <div className="mx-auto max-w-md space-y-5">
        <div className="text-center text-white">
          <CheckCircle2 className="mx-auto h-16 w-16 text-gold-300" />
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-wide uppercase">Registration Successful</h1>
          {payment.tournamentName && <p className="text-lg text-pitch-100">{payment.tournamentName}</p>}
        </div>

        {/* Player card */}
        <div ref={cardRef} className="overflow-hidden rounded-3xl bg-white shadow-xl">
          <div className="bg-pitch-900 px-5 py-4 text-center">
            {payment.tournamentName && (
              <p className="mb-1 text-sm font-bold tracking-wider text-white uppercase">{payment.tournamentName}</p>
            )}
            <p className="text-sm font-semibold tracking-[0.25em] text-pitch-200 uppercase">Your S.L. No</p>
            <p className="font-display text-6xl font-extrabold tracking-wider text-gold-400 sm:text-7xl">{player.slNo}</p>
          </div>
          <div className="p-5">
            <img
              src={imageUrl(player.photoUrl)}
              alt={player.fullName}
              onLoad={() => setPhotoReady(true)}
              onError={() => setPhotoReady(true)}
              className="mx-auto -mt-1 mb-4 h-44 w-44 rounded-2xl border-4 border-pitch-100 object-cover shadow"
            />
            <DetailRow label="Name">{player.fullName}</DetailRow>
            <DetailRow label="Cricket Style">
              {style.emoji} {player.cricketStyle}
            </DetailRow>
            <DetailRow label="Mobile">{player.mobile}</DetailRow>
            <DetailRow label="Registered">{formatDate(player.registrationDate)}</DetailRow>
            <DetailRow label="Payment">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-base text-amber-800">Unpaid</span>
            </DetailRow>
          </div>
          <div className="flex items-center gap-3 bg-gold-300/40 px-5 py-4 text-amber-900">
            <Camera className="h-8 w-8 shrink-0" />
            <p className="text-lg leading-snug font-bold">Please take a screenshot of this page.</p>
          </div>
        </div>

        <button
          onClick={() => saveCard(true)}
          disabled={saveState === 'saving'}
          className={`flex h-16 w-full items-center justify-center gap-2 rounded-2xl text-lg font-bold shadow-lg transition active:scale-[0.98] ${
            saveState === 'saved' ? 'bg-pitch-600 text-white' : 'bg-gold-400 text-pitch-900'
          }`}
        >
          {saveState === 'saving' ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : saveState === 'saved' ? (
            <Check className="h-6 w-6" />
          ) : (
            <Download className="h-6 w-6" />
          )}
          {saveState === 'saving' ? 'Saving card…' : saveState === 'saved' ? 'Card saved · Save again' : 'Save my card'}
        </button>
        {saveState === 'saved' && (
          <p className="-mt-3 text-center text-base text-pitch-800">Saved to your phone (Downloads / Photos).</p>
        )}
        {saveState === 'error' && (
          <p className="-mt-3 text-center text-base font-semibold text-ball-600">
            Could not save the card. Please take a screenshot instead.
          </p>
        )}

        {/* Payment */}
        <div className="rounded-3xl bg-white p-5 text-center shadow-xl">
          <p className="text-lg font-semibold text-slate-500">Registration Fee</p>
          <p className="font-display text-7xl font-extrabold text-pitch-800">₹{payment.amount}</p>

          {upiLink ? (
            <>
              <a
                href={upiLink}
                className="mt-4 flex h-20 w-full items-center justify-center gap-3 rounded-2xl bg-ball-500 text-2xl font-bold text-white shadow-lg active:scale-[0.98]"
              >
                <Smartphone className="h-8 w-8" /> Pay ₹{payment.amount} with UPI
              </a>
              <p className="mt-2 text-base text-slate-500">Opens GPay / PhonePe / Paytm</p>

              <div className="my-6 flex items-center gap-3 text-sm font-semibold text-slate-400 uppercase">
                <span className="h-px flex-1 bg-slate-200" /> or scan <span className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="mx-auto inline-block rounded-2xl border-2 border-slate-200 bg-white p-3">
                <QRCodeSVG value={upiLink} size={208} level="M" />
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">UPI ID</p>
                <p className="text-xl font-bold break-all text-slate-800">{payment.upiId}</p>
                {payment.payeeName && <p className="text-base text-slate-500">{payment.payeeName}</p>}
                <button
                  onClick={onCopy}
                  className={`mt-3 inline-flex h-14 items-center gap-2 rounded-xl px-6 text-lg font-bold transition active:scale-95 ${
                    copied ? 'bg-pitch-600 text-white' : 'border-2 border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  {copied ? <Check className="h-6 w-6" /> : <Copy className="h-6 w-6" />}
                  {copied ? 'Copied' : 'Copy UPI ID'}
                </button>
                <p className="mt-3 text-base text-slate-600">
                  Pay exactly <b>₹{payment.amount}</b>
                </p>
              </div>
            </>
          ) : (
            <p className="mt-4 text-base text-slate-600">Please pay the fee to the organiser.</p>
          )}

          <p className="mt-5 text-base leading-relaxed text-slate-500">
            After you pay, the organiser will check and mark your payment as <b className="text-pitch-700">Paid</b>.
          </p>
        </div>

        <button
          onClick={onRegisterAnother}
          className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl border-2 border-pitch-600 bg-white text-lg font-bold text-pitch-700 active:scale-[0.98]"
        >
          <UserPlus className="h-6 w-6" /> Register another player
        </button>
      </div>
    </div>
  );
}
