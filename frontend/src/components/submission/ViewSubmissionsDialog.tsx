import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Assignment, Submission, submissionsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, CheckCircle, FileText } from 'lucide-react';
import { PdfViewerDialog } from '@/components/ui/pdf-viewer';

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

  const openPdfViewer = (submission: Submission) => {
    setPdfSubmission(submission);
    setPdfOpen(true);
  };

  const fetchSubmissionPdf = useCallback(async (index: number) => {
    if (!assignment || !pdfSubmission) throw new Error('No submission selected');
    return submissionsApi.getPdf(courseId, assignment.id, pdfSubmission.id, index);
  }, [courseId, assignment, pdfSubmission]);

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
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => openPdfViewer(s)}>
                        <FileText className="h-4 w-4" />
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
                {selected?.description || '(Trống)'}
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
      <PdfViewerDialog
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        title={pdfSubmission ? `Bài nộp: ${pdfSubmission.username}` : 'PDF Viewer'}
        description={pdfSubmission ? `Nộp lúc: ${formatDateTime(pdfSubmission.submissionTime)} • ${pdfSubmission.fileCount || 0} phiên bản` : ''}
        fetchPdf={fetchSubmissionPdf}
        totalFiles={pdfSubmission?.fileCount}
      />
    </Dialog>
  );
};

export default ViewSubmissionsDialog;
