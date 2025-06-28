'use client';

import { useCallback, useContext, useState, useRef, useEffect } from 'react';
import { useResizeObserver } from '@wojtekmaj/react-hooks';
import { pdfjs, Document, Page } from 'react-pdf';
import { PDFContext } from '../PDFEditor'
import Konva from 'konva'
import PDFKonvaStage from './PDFKonvaStage'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Mode, PageAnnotations } from '../types/types'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const options = {
  cMapUrl: '/cmaps/',
  standardFontDataUrl: '/standard_fonts/',
};

const maxWidth = 400;
const resizeObserverOptions = {};

interface RenderPDFTypes {
  url: string;
  annotations: PageAnnotations[];
  mode: Mode
}


export default function RenderPDF({ url, annotations, mode }: RenderPDFTypes) {
  const pdf = useContext(PDFContext)
  const [numPages, setNumPages] = useState<number>();
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [pageHeights, setPageHeights] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageWidth = containerWidth? Math.max(containerWidth, maxWidth) : maxWidth
  
  const onResize = useCallback<ResizeObserverCallback>((entries) => {
    const [entry] = entries;

    if (entry) {
      setContainerWidth(entry.contentRect.width);
    }
  }, []);

  useResizeObserver(containerRef.current ?? null, resizeObserverOptions, onResize);

  function onDocumentLoadSuccess({ numPages: numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  function onPageLoadSuccess({ pageNumber, width, height }: { pageNumber: number, width: number, height: number }): void {
    const scale = pageWidth / width;
    const scaledHeight = height * scale;
    
    setPageHeights(prev => {
      const newHeights = [...prev];
      newHeights[pageNumber - 1] = scaledHeight;
      return newHeights;
    });
    
    if(!pdf) return
    pdf.initNewPageAnnotation()
  }
  

  return (
    <div className="relative flex flex-col h-full ">
      <div >
        <div className="relative flex-1 overflow-auto bg-gray-200 p-4">
          <div ref={containerRef} className="relative mx-auto max-w-4xl">
            <Document className="relative flex flex-col gap-4 bg-transparent w-full" file={url} onLoadSuccess={onDocumentLoadSuccess} options={options}>
              {Array.from(new Array(numPages), (_el, index) => (
                <div key={`page_${index + 1}`} className="relative">
                 <PDFKonvaStage
                    size={{ x: pageWidth, y: pageHeights[index]}}
                    pageNo={index + 1}
                  />
                  <Page
                    className="relative w-full border border-gray-300"
                    pageNumber={index + 1}
                    width={pageWidth}
                    onLoadSuccess={onPageLoadSuccess}
                  />
                </div>
              ))}
            </Document>
          </div>
        </div>
      </div>
    </div>
  );
}