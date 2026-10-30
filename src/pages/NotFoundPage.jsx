import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-pitch-900 px-4 text-center text-white">
      <p className="font-display text-8xl font-extrabold text-gold-400">404</p>
      <p className="mt-2 text-lg">This page is out of the ground.</p>
      <div className="mt-6 flex gap-3">
        <Link to="/registerplayer" className="btn-gold">
          Player Registration
        </Link>
        <Link to="/" className="btn border border-pitch-500 text-white hover:bg-pitch-800">
          Staff Login
        </Link>
      </div>
    </div>
  );
}
