import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, Camera, CheckCircle2, ImagePlus, Loader2, Phone, RefreshCw, User } from 'lucide-react';
import { publicService } from '../services';
import { CRICKET_STYLES, TOURNAMENT_FULL_NAME } from '../utils/constants';
import { BrandLogo } from '../components/common/Avatar';
import { compressImage, validateImage, validateUploadSize } from '../utils/image';
import RegistrationSuccess from '../components/players/RegistrationSuccess';

const LAST_REG_KEY = 'cricket_last_registration';

const readSaved = () => {
  try {
    return JSON.parse(sessionStorage.getItem(LAST_REG_KEY) || 'null');
  } catch {
    return null;
  }
};

/** Shown when the admin has switched off player registration. */
function RegistrationClosed({ tournamentName }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-pitch-800 to-pitch-700 px-4 py-10">
      <div role="alert" className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
        <BrandLogo className="mx-auto mb-4 h-20 w-20" />
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <Ban className="h-11 w-11 text-ball-500" />
        </div>
        {tournamentName && <p className="text-base font-semibold text-slate-500">{tournamentName}</p>}
        <h1 className="mt-1 font-display text-4xl font-extrabold tracking-wide text-ball-600 uppercase">
          Registration is disabled
        </h1>
        <p className="mt-3 text-xl font-semibold text-slate-700">Please contact the admin.</p>
        <Link
          to="/"
          className="mt-8 inline-flex h-14 items-center justify-center rounded-xl border-2 border-slate-300 px-8 text-lg font-bold text-slate-700 active:scale-95"
        >
          Back
        </Link>
      </div>
    </div>
  );
}

function StepLabel({ number, icon: Icon, children }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pitch-700 font-display text-xl font-bold text-white">
        {number}
      </span>
      <Icon className="h-7 w-7 text-pitch-700" aria-hidden />
      <span className="text-xl font-bold text-slate-800">{children}</span>
    </div>
  );
}

export default function RegisterPage() {
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({ fullName: '', cricketStyle: '', mobile: '' });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(readSaved);
  const [closed, setClosed] = useState(false);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const sectionRefs = { fullName: useRef(null), cricketStyle: useRef(null), mobile: useRef(null), photo: useRef(null) };

  useEffect(() => {
    publicService
      .getConfig()
      .then((res) => {
        setConfig(res.data);
        if (res.data.registrationOpen === false) setClosed(true);
      })
      .catch(() => setConfig(null));
  }, []);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const setField = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const onPhotoPicked = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const typeError = validateImage(file);
    if (typeError) {
      setErrors((er) => ({ ...er, photo: typeError }));
      return;
    }
    const compressed = await compressImage(file);
    const sizeError = validateUploadSize(compressed);
    if (sizeError) {
      setErrors((er) => ({ ...er, photo: sizeError }));
      return;
    }
    setPhoto(compressed);
    setPreview(URL.createObjectURL(compressed));
    setErrors((er) => ({ ...er, photo: undefined }));
  };

  const validate = () => {
    const e = {};
    if (form.fullName.trim().length < 2) e.fullName = 'Please write your full name';
    if (!form.cricketStyle) e.cricketStyle = 'Please tap one cricket style';
    if (!/^[6-9]\d{9}$/.test(form.mobile)) e.mobile = 'Please enter your 10-digit mobile number';
    if (!photo) e.photo = 'Please add your photo';
    return e;
  };

  const scrollToFirstError = (e) => {
    const first = ['fullName', 'cricketStyle', 'mobile', 'photo'].find((k) => e[k]);
    sectionRefs[first]?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      scrollToFirstError(e);
      return;
    }

    setSubmitting(true);
    setProgress(0);
    try {
      const res = await publicService.register(
        { fullName: form.fullName.trim(), cricketStyle: form.cricketStyle, mobile: form.mobile, photo },
        (p) => p.total && setProgress(Math.round((p.loaded / p.total) * 100))
      );
      setResult(res.data);
      try {
        sessionStorage.setItem(LAST_REG_KEY, JSON.stringify(res.data));
      } catch {
        /* storage unavailable */
      }
      window.scrollTo({ top: 0 });
    } catch (err) {
      if (err.details?.registrationClosed) {
        // Admin closed registration while this player was filling the form
        setClosed(true);
        window.scrollTo({ top: 0 });
        return;
      }
      const serverErrors = err.details || { form: err.message };
      setErrors(serverErrors);
      scrollToFirstError(serverErrors);
    } finally {
      setSubmitting(false);
    }
  };

  const startOver = () => {
    try {
      sessionStorage.removeItem(LAST_REG_KEY);
    } catch {
      /* storage unavailable */
    }
    setResult(null);
    setForm({ fullName: '', cricketStyle: '', mobile: '' });
    setPhoto(null);
    setPreview('');
    setErrors({});
    window.scrollTo({ top: 0 });
  };

  if (result) return <RegistrationSuccess data={result} onRegisterAnother={startOver} />;
  if (closed) return <RegistrationClosed tournamentName={config?.tournamentName} />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pitch-800 via-pitch-700 to-pitch-50 pb-10">
      <header className="px-4 pt-8 pb-6 text-center text-white">
        <BrandLogo className="mx-auto mb-3 h-28 w-28" />
        <h1 className="font-display text-4xl leading-tight font-extrabold tracking-wide uppercase">
          {config?.tournamentName || TOURNAMENT_FULL_NAME}
        </h1>
        <p className="mt-1 text-lg font-medium text-pitch-100">Player Registration</p>
        {config?.registrationFee ? (
          <p className="mt-2 inline-block rounded-full bg-gold-400 px-4 py-1 text-base font-bold text-pitch-900">
            Fee ₹{config.registrationFee}
          </p>
        ) : null}
      </header>

      <form onSubmit={onSubmit} noValidate className="mx-auto max-w-md space-y-5 px-4">
        {/* 1. Name */}
        <section ref={sectionRefs.fullName} className="rounded-2xl bg-white p-5 shadow-md">
          <StepLabel number={1} icon={User}>
            Full Name
          </StepLabel>
          <input
            className={`h-16 w-full rounded-xl border-2 px-4 text-xl font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:outline-none ${
              errors.fullName ? 'border-ball-500' : 'border-slate-300 focus:border-pitch-500'
            }`}
            placeholder="Your name"
            autoComplete="name"
            autoCapitalize="words"
            value={form.fullName}
            maxLength={100}
            onChange={(e) => setField('fullName', e.target.value)}
          />
          {errors.fullName && <p className="mt-2 text-base font-semibold text-ball-500">⚠ {errors.fullName}</p>}
        </section>

        {/* 2. Cricket style */}
        <section ref={sectionRefs.cricketStyle} className="rounded-2xl bg-white p-5 shadow-md">
          <StepLabel number={2} icon={() => <span className="text-2xl">🏏</span>}>
            Cricket Style
          </StepLabel>
          <div className="grid grid-cols-2 gap-3">
            {CRICKET_STYLES.map((s) => {
              const selected = form.cricketStyle === s.value;
              return (
                <button
                  type="button"
                  key={s.value}
                  onClick={() => setField('cricketStyle', s.value)}
                  aria-pressed={selected}
                  className={`relative flex min-h-28 flex-col items-center justify-center gap-1 rounded-2xl border-[3px] px-2 py-4 transition active:scale-95 ${
                    selected
                      ? 'border-pitch-600 bg-pitch-50 shadow-inner'
                      : 'border-slate-200 bg-white hover:border-pitch-300'
                  }`}
                >
                  {selected && <CheckCircle2 className="absolute top-2 right-2 h-6 w-6 text-pitch-600" />}
                  <span className="text-5xl leading-none" aria-hidden>
                    {s.emoji}
                  </span>
                  <span className={`text-lg font-bold ${selected ? 'text-pitch-800' : 'text-slate-700'}`}>{s.label}</span>
                </button>
              );
            })}
          </div>
          {errors.cricketStyle && <p className="mt-2 text-base font-semibold text-ball-500">⚠ {errors.cricketStyle}</p>}
        </section>

        {/* 3. Mobile */}
        <section ref={sectionRefs.mobile} className="rounded-2xl bg-white p-5 shadow-md">
          <StepLabel number={3} icon={Phone}>
            Mobile Number
          </StepLabel>
          <div
            className={`flex h-16 items-center overflow-hidden rounded-xl border-2 ${
              errors.mobile ? 'border-ball-500' : 'border-slate-300 focus-within:border-pitch-500'
            }`}
          >
            <span className="flex h-full items-center bg-slate-100 px-4 text-xl font-semibold text-slate-600">+91</span>
            <input
              className="h-full w-full px-4 text-2xl font-semibold tracking-widest text-slate-800 placeholder:tracking-normal placeholder:font-normal placeholder:text-lg placeholder:text-slate-400 focus:outline-none"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="10 digits"
              value={form.mobile}
              onChange={(e) => setField('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
            />
          </div>
          <p className="mt-1.5 text-right text-sm text-slate-400">{form.mobile.length}/10</p>
          {errors.mobile && <p className="mt-1 text-base font-semibold text-ball-500">⚠ {errors.mobile}</p>}
        </section>

        {/* 4. Photo */}
        <section ref={sectionRefs.photo} className="rounded-2xl bg-white p-5 shadow-md">
          <StepLabel number={4} icon={Camera}>
            Your Photo
          </StepLabel>

          <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={onPhotoPicked} />
          <input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPhotoPicked} />

          {preview ? (
            <div className="text-center">
              <img src={preview} alt="Your photo" className="mx-auto h-64 w-64 rounded-2xl border-4 border-pitch-200 object-cover shadow" />
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 px-5 py-3 text-lg font-semibold text-slate-700 active:scale-95"
              >
                <RefreshCw className="h-5 w-5" /> Change Photo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border-[3px] border-dashed border-pitch-300 bg-pitch-50 text-pitch-800 active:scale-95"
              >
                <Camera className="h-12 w-12" />
                <span className="text-lg font-bold">Camera</span>
              </button>
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border-[3px] border-dashed border-slate-300 bg-slate-50 text-slate-700 active:scale-95"
              >
                <ImagePlus className="h-12 w-12" />
                <span className="text-lg font-bold">Gallery</span>
              </button>
            </div>
          )}
          {errors.photo && <p className="mt-2 text-base font-semibold text-ball-500">⚠ {errors.photo}</p>}
        </section>

        {errors.form && (
          <div className="rounded-xl border-2 border-ball-500 bg-red-50 p-4 text-center text-lg font-semibold text-ball-600">
            {errors.form}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex h-20 w-full items-center justify-center gap-3 rounded-2xl bg-ball-500 font-display text-3xl font-bold tracking-wider text-white uppercase shadow-lg transition active:scale-[0.98] disabled:opacity-70"
        >
          {submitting ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin" /> {progress < 100 ? `Sending ${progress}%` : 'Saving…'}
            </>
          ) : (
            <>
              <CheckCircle2 className="h-8 w-8" /> Register
            </>
          )}
        </button>

        <p className="pt-2 text-center text-sm text-slate-500">
          Staff?{' '}
          <Link to="/" className="font-semibold text-pitch-700 underline">
            Log in here
          </Link>
        </p>
      </form>
    </div>
  );
}
