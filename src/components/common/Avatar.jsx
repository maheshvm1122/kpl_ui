import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { imageUrl, initials } from '../../utils/format';
import { TOURNAMENT, TOURNAMENT_FULL_NAME } from '../../utils/constants';

const SIZES = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-20 w-20 text-xl',
};

/** Tournament logo (public/logo.png). Shows a trophy until the logo file is added. */
export function BrandLogo({ className = 'h-10 w-10' }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`${className} flex shrink-0 items-center justify-center rounded-full bg-ball-500`}>
        <Trophy className="h-1/2 w-1/2 text-gold-300" />
      </div>
    );
  }
  return (
    <img
      src={TOURNAMENT.logo}
      alt={TOURNAMENT_FULL_NAME}
      className={`${className} shrink-0 rounded-xl object-cover shadow-lg`}
      onError={() => setFailed(true)}
    />
  );
}

/** Player photo / team logo with an initials fallback. */
export default function Avatar({ src, name, size = 'sm', rounded = 'rounded-lg', className = '' }) {
  const [failed, setFailed] = useState(false);
  const cls = `${SIZES[size]} ${rounded} shrink-0 object-cover ${className}`;
  if (!src || failed) {
    return (
      <div className={`${cls} flex items-center justify-center bg-pitch-100 font-bold text-pitch-700`}>
        {initials(name) || '?'}
      </div>
    );
  }
  return <img src={imageUrl(src)} alt={name} loading="lazy" className={cls} onError={() => setFailed(true)} />;
}
