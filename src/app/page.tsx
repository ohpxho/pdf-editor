'use client'

import dynamic from 'next/dynamic';

const PDFEditor = dynamic(
  () => import('./PDFEditor'),
  { ssr: false }
);

export default function Home() {
  return (
    <div className="relative h-screen">
      <PDFEditor />
    </div>
  );
}
