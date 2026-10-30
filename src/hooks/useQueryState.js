import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * List filters kept in the URL (?search=..&page=..), so they survive opening a
 * player and coming back, and can be bookmarked.
 */
export default function useQueryState(defaults) {
  const [params, setParams] = useSearchParams();

  const query = useMemo(() => {
    const q = { ...defaults };
    Object.keys(defaults).forEach((key) => {
      if (params.has(key)) q[key] = key === 'page' ? Number(params.get(key)) || 1 : params.get(key);
    });
    return q;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const setQuery = useCallback(
    (patch) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const merged = { ...patch };
          if (!('page' in patch)) merged.page = 1; // filter changes reset to page 1
          Object.entries(merged).forEach(([key, value]) => {
            if (value === '' || value === undefined || value === null || value === defaults[key]) next.delete(key);
            else next.set(key, String(value));
          });
          return next;
        },
        { replace: true }
      );
    },
    [setParams, defaults]
  );

  return [query, setQuery, params.toString()];
}
