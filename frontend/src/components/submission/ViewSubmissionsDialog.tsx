import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Assignment, Submission, submissionsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, CheckCircle, ZoomIn, ZoomOut, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

interface ViewSubmissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: Assignment | null;
  courseId: number;
}

const formatDateTime = (iso?: string) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString(); } catch { return String(iso); }
};

export const ViewSubmissionsDialog: React.FC<ViewSubmissionsDialogProps> = ({ open, onOpenChange, assignment, courseId }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState<Submission[]>([]);

  // Detail modal state
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [gradeStr, setGradeStr] = useState<string>('');
  const [isGrading, setIsGrading] = useState(false);

  // PDF viewer state
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [currentPdfIndex, setCurrentPdfIndex] = useState(0);
  const [pdfSubmission, setPdfSubmission] = useState<Submission | null>(null);

  const title = useMemo(() => assignment ? `Bài nộp cho: ${assignment.assignmentName}` : 'Bài nộp', [assignment]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!open || !assignment || !assignment.id || !courseId) { setRows([]); return; }
      setIsLoading(true);
      try {
        const list = await submissionsApi.getByAssignment(courseId, assignment.id);
        if (!mounted) return;
        setRows(list || []);
      } catch (error: any) {
        if (!mounted) return;
        toast({ title: 'Không thể tải bài nộp', description: error.response?.data?.message || 'Vui lòng thử lại sau', variant: 'destructive' });
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [open, assignment?.id, courseId, toast]);

  const openDetail = (s: Submission) => {
    setSelected(s);
    setGradeStr(s.grade != null ? String(s.grade) : '');
    setDetailOpen(true);
  };

  const handleGrade = async () => {
    if (!selected || !assignment) return;
    const parsed = Number(gradeStr);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      toast({ title: 'Điểm không hợp lệ', description: 'Vui lòng nhập số từ 0 đến 100', variant: 'destructive' });
      return;
    }
    setIsGrading(true);
    try {
      const updated = await submissionsApi.grade(courseId, assignment.id, selected.id, parsed);
      toast({ title: 'Đã chấm điểm', description: `${selected.username} - ${parsed}` });
      // update table row
      setRows(prev => prev.map(r => r.id === updated.id ? { ...r, grade: updated.grade } : r));
      setSelected(prev => prev ? { ...prev, grade: updated.grade } as Submission : prev);
    } catch (error: any) {
      toast({ title: 'Chấm điểm thất bại', description: error.response?.data?.message || 'Vui lòng thử lại', variant: 'destructive' });
    } finally {
      setIsGrading(false);
    }
  };

  const closeAll = () => {
    setDetailOpen(false);
    setSelected(null);
    onOpenChange(false);
  };

  // PDF viewer functions
  const loadPdf = useCallback(async (submission: Submission, index: number) => {
    if (!assignment) return;
    setPdfLoading(true);
    setPdfSubmission(submission);
    setCurrentPdfIndex(index);
    
    // Revoke previous URL to prevent memory leaks
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }

    try {
      const blob = await submissionsApi.getPdf(courseId, assignment.id, submission.id, index);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfOpen(true);
    } catch (error: any) {
      toast({
        title: 'Không thể tải PDF',
        description: error.response?.data?.message || 'Vui lòng thử lại sau',
        variant: 'destructive',
      });
    } finally {
      setPdfLoading(false);
    }
  }, [pdfUrl, toast, courseId, assignment]);

  const openPdfViewer = (submission: Submission) => {
    setPdfZoom(100);
    loadPdf(submission, 0);
  };

  const closePdfViewer = useCallback(() => {
    setPdfOpen(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setPdfSubmission(null);
    setCurrentPdfIndex(0);
    setPdfZoom(100);
  }, [pdfUrl]);

  const handleZoomIn = () => {
    setPdfZoom(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setPdfZoom(prev => Math.max(prev - 25, 25));
  };

  const handlePrevPdf = () => {
    if (pdfSubmission && currentPdfIndex > 0) {
      loadPdf(pdfSubmission, currentPdfIndex - 1);
    }
  };

  const handleNextPdf = () => {
    if (pdfSubmission) {
      loadPdf(pdfSubmission, currentPdfIndex + 1);
    }
  };

  // Cleanup PDF URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bài nộp</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>
        <div className="py-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">Chưa có bài nộp nào</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Điểm</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.username}</TableCell>
                    <TableCell>{formatDateTime(s.submissionTime)}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === 'LATE' ? 'destructive' : 'secondary'}>
                        {s.status === 'LATE' ? 'Trễ hạn' : 'Đã nộp'}
                      </Badge>
                    </TableCell>
                    <TableCell>{s.grade != null ? s.grade : '-'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => openPdfViewer(s)} disabled={pdfLoading}>
                        {pdfLoading && pdfSubmission?.id === s.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        PDF
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => openDetail(s)}>
                        <Eye className="h-4 w-4" />
                        Chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết bài nộp</DialogTitle>
            <DialogDescription>
              {selected ? `${selected.username} • ${formatDateTime(selected.submissionTime)}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="mb-1 block">Nội dung</Label>
              <div className="rounded-md border bg-muted p-3 max-h-72 overflow-auto whitespace-pre-wrap text-sm">
                {selected?.content || '(Trống)'}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <Label htmlFor="grade">Điểm</Label>
                <Input
                  id="grade"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0 - 100"
                  value={gradeStr}
                  onChange={(e) => setGradeStr(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleGrade} disabled={isGrading || !gradeStr.trim()}>
                  {isGrading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Lưu điểm
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Đóng</Button>
            <Button variant="secondary" onClick={closeAll}>Đóng tất cả</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Modal */}
      <Dialog open={pdfOpen} onOpenChange={(open) => !open && closePdfViewer()}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-2 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              PDF Viewer
            </DialogTitle>
            <DialogDescription>
              {pdfSubmission ? `${pdfSubmission.username} • Tệp ${currentPdfIndex + 1}` : ''}
            </DialogDescription>
          </DialogHeader>
          
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50 shrink-0">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrevPdf}
                disabled={currentPdfIndex === 0 || pdfLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                Tệp {currentPdfIndex + 1}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleNextPdf}
                disabled={pdfLoading}
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
            <Button variant="outline" onClick={closePdfViewer}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default ViewSubmissionsDialog;
