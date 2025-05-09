'use client'

import dynamic from 'next/dynamic';

const PDFViewer = dynamic(
  () => import('./components/PDFViewer'),
  { ssr: false }
);

export default function Home() {
  return (
    <div>
      <PDFViewer url="/pdf/test2.pdf" />
    </div>
  );
}
