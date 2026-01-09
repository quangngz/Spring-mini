import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ZoomIn, ZoomOut, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

interface PdfViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  fetchPdf: (index: number) => Promise<Blob>;
  totalFiles?: number;
}

export const PdfViewerDialog: React.FC<PdfViewerProps> = ({
  open,
  onOpenChange,
  title = 'PDF Viewer',
  description = '',
  fetchPdf,
  totalFiles,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [currentPdfIndex, setCurrentPdfIndex] = useState(0);
  const [knownTotalFiles, setKnownTotalFiles] = useState(totalFiles ?? 0);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const loadPdf = useCallback(async (index: number) => {
    setPdfLoading(true);
    setPdfError(null);

    // Revoke previous URL to prevent memory leaks
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }

    try {
      const blob = await fetchPdf(index);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setCurrentPdfIndex(index);
      // If we successfully loaded this index, there's at least index+1 files
      setKnownTotalFiles(prev => Math.max(prev, index + 1));
    } catch (error: any) {
      // If we get an error on index > 0, we've reached the end
      if (index > 0) {
        setKnownTotalFiles(index);
        setPdfError(null);
      } else {
        setPdfError('Không thể tải PDF');
      }
    } finally {
      setPdfLoading(false);
    }
  }, [pdfUrl, fetchPdf]);

  const cleanup = useCallback(() => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setPdfZoom(100);
    setCurrentPdfIndex(0);
    setPdfError(null);
  }, [pdfUrl]);

  const handleClose = () => {
    cleanup();
    onOpenChange(false);
  };

  const handleZoomIn = () => {
    setPdfZoom(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setPdfZoom(prev => Math.max(prev - 25, 25));
  };

  const handlePrevPdf = () => {
    if (currentPdfIndex > 0) {
      loadPdf(currentPdfIndex - 1);
    }
  };

  const handleNextPdf = () => {
    loadPdf(currentPdfIndex + 1);
  };

  // Load first PDF when dialog opens
  useEffect(() => {
    if (open) {
      setKnownTotalFiles(totalFiles ?? 0);
      loadPdf(0);
    }
    return () => {
      if (!open) {
        cleanup();
      }
    };
  }, [open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrevPdf}
              disabled={currentPdfIndex === 0 || pdfLoading}
              title="Phiên bản mới hơn"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[120px] text-center">
              {currentPdfIndex === 0 ? 'Mới nhất' : `Phiên bản ${knownTotalFiles - currentPdfIndex}`}
              {knownTotalFiles > 0 ? ` / ${knownTotalFiles}` : ''}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleNextPdf}
              disabled={pdfLoading || (knownTotalFiles > 0 && currentPdfIndex >= knownTotalFiles - 1)}
              title="Phiên bản cũ hơn"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomOut}
              disabled={pdfZoom <= 25}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[60px] text-center">
              {pdfZoom}%
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomIn}
              disabled={pdfZoom >= 300}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900">
          {pdfLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pdfError ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{pdfError}</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <div
              className="min-h-full flex justify-center p-4"
              style={{
                overflow: 'auto',
              }}
            >
              <iframe
                src={pdfUrl}
                title="PDF Viewer"
                className="border-0 shadow-lg bg-white"
                style={{
                  width: `${pdfZoom}%`,
                  minWidth: '600px',
                  height: `${Math.max(pdfZoom, 100)}%`,
                  minHeight: '800px',
                  transform: `scale(${pdfZoom / 100})`,
                  transformOrigin: 'top center',
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Không thể hiển thị PDF
            </div>
          )}
        </div>

        <DialogFooter className="p-4 pt-2 border-t shrink-0">
          <Button variant="outline" onClick={handleClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Inline PDF viewer (not a dialog) for embedding in other components
interface InlinePdfViewerProps {
  fetchPdf: (index: number) => Promise<Blob>;
  height?: string;
  onError?: (error: string) => void;
}

export const InlinePdfViewer: React.FC<InlinePdfViewerProps> = ({
  fetchPdf,
  height = '300px',
  onError,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [currentPdfIndex, setCurrentPdfIndex] = useState(0);
  const [knownTotalFiles, setKnownTotalFiles] = useState(0);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const loadPdf = useCallback(async (index: number) => {
    setPdfLoading(true);
    setPdfError(null);

    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }

    try {
      const blob = await fetchPdf(index);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setCurrentPdfIndex(index);
      setKnownTotalFiles(prev => Math.max(prev, index + 1));
    } catch (error: any) {
      if (index > 0) {
        setKnownTotalFiles(index);
      } else {
        const errMsg = 'Không có tệp PDF nào';
        setPdfError(errMsg);
        onError?.(errMsg);
      }
    } finally {
      setPdfLoading(false);
    }
  }, [pdfUrl, fetchPdf, onError]);

  useEffect(() => {
    loadPdf(0);
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, []);

  const handleZoomIn = () => setPdfZoom(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setPdfZoom(prev => Math.max(prev - 25, 25));
  const handlePrevPdf = () => currentPdfIndex > 0 && loadPdf(currentPdfIndex - 1);
  const handleNextPdf = () => loadPdf(currentPdfIndex + 1);

  return (
    <div className="border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrevPdf}
            disabled={currentPdfIndex === 0 || pdfLoading}
            title="Phiên bản mới hơn"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[120px] text-center">
            {currentPdfIndex === 0 ? 'Mới nhất' : `Phiên bản ${knownTotalFiles - currentPdfIndex}`}
            {knownTotalFiles > 0 ? ` / ${knownTotalFiles}` : ''}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleNextPdf}
            disabled={pdfLoading || (knownTotalFiles > 0 && currentPdfIndex >= knownTotalFiles - 1)}
            title="Phiên bản cũ hơn"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleZoomOut} disabled={pdfZoom <= 25}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[50px] text-center">{pdfZoom}%</span>
          <Button size="sm" variant="outline" onClick={handleZoomIn} disabled={pdfZoom >= 300}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="overflow-auto" style={{ height }}>
        {pdfLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : pdfError ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{pdfError}</p>
            </div>
          </div>
        ) : pdfUrl ? (
          <div className="min-h-full flex justify-center p-2">
            <iframe
              src={pdfUrl}
              title="PDF Viewer"
              className="border-0 shadow-lg bg-white"
              style={{
                width: `${pdfZoom}%`,
                minWidth: '500px',
                height: '100%',
                minHeight: '280px',
                transform: `scale(${pdfZoom / 100})`,
                transformOrigin: 'top center',
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Đang tải...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfViewerDialog;
