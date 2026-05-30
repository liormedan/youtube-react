'use client';
import React, { Suspense } from 'react';
import Search from '../../src/containers/Search/Search';
import { useSearchParams, useRouter } from 'next/navigation';

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const key = searchParams.get('search_query') || 'default';
  const location = { search: `?${searchParams.toString()}` };
  const history = { push: (url) => router.push(url) };
  return <Search key={key} location={location} history={history} />;
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchResults />
    </Suspense>
  );
}
