'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type FeedFiltersContextType = {
  tlds: Set<string>;
  toggleTld: (domain: string) => void;
};

const FeedFiltersContext = createContext<FeedFiltersContextType>({
  tlds: new Set(),
  toggleTld: () => {},
});

export function FeedFiltersProvider({ children }: { children: React.ReactNode }) {
  const [tlds, setTlds] = useState<Set<string>>(new Set());
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tldsParam = searchParams.get('tlds');
    if (tldsParam) {
      setTlds(new Set(tldsParam.split(',')));
    }
  }, [searchParams]);

  const toggleTld = (domain: string) => {
    const newTlds = new Set(tlds);
    if (newTlds.has(domain)) {
      newTlds.delete(domain);
    } else {
      newTlds.add(domain);
    }
    setTlds(newTlds);

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    if (newTlds.size > 0) {
      params.set('tlds', Array.from(newTlds).join(','));
    } else {
      params.delete('tlds');
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <FeedFiltersContext.Provider value={{ tlds, toggleTld }}>
      {children}
    </FeedFiltersContext.Provider>
  );
}

export function useFeedFilters() {
  const context = useContext(FeedFiltersContext);
  if (!context) {
    throw new Error('useFeedFilters must be used within a FeedFiltersProvider');
  }
  return context;
} 