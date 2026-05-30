'use client';
import React, { Suspense } from 'react';
import Watch from '../../src/containers/Watch/Watch';
import { useSearchParams, useRouter } from 'next/navigation';

function WatchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const key = searchParams.get('v') || 'default';
  const location = { search: `?${searchParams.toString()}` };
  const history = { push: (url) => router.push(url) };
  return <Watch key={key} location={location} history={history} />;
}

export default function WatchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WatchContent />
    </Suspense>
  );
}
