'use client';

import React, { Suspense } from 'react';
import DocsLayout from '@/components/DocsLayout';

function DocsContent() {
  return <DocsLayout />;
}

export default function DocsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DocsContent />
    </Suspense>
  );
} 