import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, CheckCircle, Upload, X, FileIcon, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Assignment, submissionsApi, Submission } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface SubmissionButtonProps {
  assignment: Assignment;
  courseId: number;
  onSuccess?: (result: Submission) => void;
  buttonSize?: 'sm' | 'default' | 'lg';
  className?: string;
}

export const SubmissionButton: React.FC<SubmissionButtonProps> = ({ assignment, courseId, onSuccess, buttonSize = 'sm', className }) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionContent, setSubmissionContent] = useState('');
  const [mySubmissionId, setMySubmissionId] = useState<number | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF viewer state for edit mode
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [currentPdfIndex, setCurrentPdfIndex] = useState(0);
  const [totalPdfFiles, setTotalPdfFiles] = useState(0);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const hasSubmitted = mySubmissionId !== null;

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      if (!user?.username) return;
      setIsLoadingStatus(true);
      try {
        const rows = await submissionsApi.getByAssignment(courseId, assignment.id);
        const mine = rows.find((s) => s.username === user.username);
        if (!isMounted) return;
        if (mine) {
          setMySubmissionId(mine.id);
          setSubmissionContent(mine.content ?? '');
        } else {
          setMySubmissionId(null);
          setSubmissionContent('');
        }
      } catch (error: any) {
        // Do not block UI; just log toast for visibility
        toast({ title: 'Không thể kiểm tra trạng thái bài nộp', description: error.response?.data?.message || 'Vui lòng thử lại sau', variant: 'destructive' });
      } finally {
        if (isMounted) setIsLoadingStatus(false);
      }
    };
    fetchStatus();
    return () => { isMounted = false; };
  }, [assignment.id, user?.username]);

  // Load PDF for viewing in edit mode
  const loadPdf = useCallback(async (index: number) => {
    if (!mySubmissionId) return;
    
    setPdfLoading(true);
    setPdfError(null);
    
    // Revoke previous URL to prevent memory leaks
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }

    try {
      const blob = await submissionsApi.getPdf(courseId, assignment.id, mySubmissionId, index);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setCurrentPdfIndex(index);
      // If we successfully loaded this index, there's at least index+1 files
      setTotalPdfFiles(prev => Math.max(prev, index + 1));
    } catch (error: any) {
      // If we get an error on index > 0, we've reached the end
      if (index > 0) {
        setTotalPdfFiles(index);
        setPdfError(null);
      } else {
        setPdfError('Không có tệp PDF nào được nộp trước đó');
      }
    } finally {
      setPdfLoading(false);
    }
  }, [mySubmissionId, pdfUrl, courseId, assignment.id]);

  // Cleanup PDF URL on unmount or dialog close
  const cleanupPdf = useCallback(() => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setPdfZoom(100);
    setCurrentPdfIndex(0);
    setTotalPdfFiles(0);
    setPdfError(null);
  }, [pdfUrl]);

  const openDialog = () => {
    // If user has submission, content already set; else start empty
    setSelectedFiles([]);
    cleanupPdf();
    setIsDialogOpen(true);
    
    // If editing, load the first PDF
    if (mySubmissionId) {
      setTimeout(() => loadPdf(0), 100);
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      cleanupPdf();
    }
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
    // Try to load the next one
    loadPdf(currentPdfIndex + 1);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedFiles(prev => [...prev, ...Array.from(files)]);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmitOrEdit = async () => {
    if (!user?.username) {
      toast({ title: 'Không thể nộp bài', description: 'Thiếu thông tin người dùng', variant: 'destructive' });
      return;
    }
    if (!submissionContent.trim() && selectedFiles.length === 0) {
      toast({ title: 'Nội dung trống', description: 'Vui lòng nhập nội dung hoặc tải lên tệp trước khi nộp', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      let result: Submission;
      const submissionData = {
        description: submissionContent.trim() || undefined,
        files: selectedFiles.length > 0 ? selectedFiles : undefined,
      };
      
      if (hasSubmitted && mySubmissionId) {
        result = await submissionsApi.edit(courseId, assignment.id, mySubmissionId, submissionData);
        toast({ title: 'Cập nhật bài nộp thành công', description: assignment.assignmentName });
      } else {
        result = await submissionsApi.submit(courseId, assignment.id, submissionData);
        toast({ title: 'Đã nộp!', description: 'Bài nộp của bạn đã được ghi nhận' });
        setMySubmissionId(result.id);
      }
      setSelectedFiles([]);
      cleanupPdf();
      setIsDialogOpen(false);
      onSuccess?.(result);
    } catch (error: any) {
      toast({ title: hasSubmitted ? 'Chỉnh sửa thất bại' : 'Nộp bài thất bại', description: error.response?.data?.message || (hasSubmitted ? 'Không thể chỉnh sửa bài nộp' : 'Không thể nộp bài tập'), variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button size={buttonSize} className={`gap-2 ${className ?? ''}`} onClick={openDialog} disabled={isLoadingStatus}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {hasSubmitted ? 'Chỉnh sửa bài nộp' : 'Nộp bài'}
        </Button>
      </DialogTrigger>
      <DialogContent className={hasSubmitted ? "max-w-4xl max-h-[90vh] flex flex-col" : ""}>
        <DialogHeader>
          <DialogTitle>{hasSubmitted ? 'Chỉnh sửa bài nộp' : 'Nộp bài tập'}</DialogTitle>
          <DialogDescription>
            {hasSubmitted ? `Chỉnh sửa cho: ${assignment.assignmentName}` : `Nộp bài cho "${assignment.assignmentName}"`}
          </DialogDescription>
        </DialogHeader>
        
        <div className={`space-y-4 py-4 ${hasSubmitted ? 'flex-1 overflow-auto' : ''}`}>
          {/* PDF Viewer Section - Only show when editing */}
          {hasSubmitted && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Bài nộp hiện tại
              </Label>
              <div className="border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
                {/* PDF Toolbar */}
                <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
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
                      Tệp {currentPdfIndex + 1}{totalPdfFiles > 0 ? ` / ${totalPdfFiles}` : ''}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleNextPdf}
                      disabled={pdfLoading || (totalPdfFiles > 0 && currentPdfIndex >= totalPdfFiles - 1)}
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
                    <span className="text-sm font-medium min-w-[50px] text-center">
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
                <div className="h-[300px] overflow-auto">
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
                      className="min-h-full flex justify-center p-2"
                      style={{ 
                        transformOrigin: 'top center',
                      }}
                    >
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
            </div>
          )}

          {/* New Submission Section */}
          {hasSubmitted && (
            <div className="border-t pt-4">
              <Label className="text-base font-semibold mb-3 block">Nộp bài mới</Label>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="submission-content">Nội dung (tùy chọn)</Label>
            <Textarea
              id="submission-content"
              placeholder={hasSubmitted ? 'Cập nhật liên kết, văn bản, hoặc câu trả lời của bạn...' : 'Nhập nội dung bài nộp tại đây...'}
              value={submissionContent}
              onChange={(e) => setSubmissionContent(e.target.value)}
              rows={4}
            />
          </div>
          
          {/* File Upload Section */}
          <div className="space-y-2">
            <Label>Tệp đính kèm</Label>
            <div 
              className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.zip,.rar,.png,.jpg,.jpeg,.gif"
              />
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Nhấp để chọn tệp hoặc kéo thả tệp vào đây
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, DOC, DOCX, TXT, ZIP, RAR, PNG, JPG, GIF
              </p>
            </div>
            
            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2 mt-3">
                <Label className="text-sm text-muted-foreground">
                  Đã chọn {selectedFiles.length} tệp
                </Label>
                <div className="max-h-32 overflow-auto space-y-1">
                  {selectedFiles.map((file, index) => (
                    <div 
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between p-2 bg-muted rounded-md text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSubmitOrEdit} disabled={isSubmitting || (!submissionContent.trim() && selectedFiles.length === 0)}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {hasSubmitted ? 'Cập nhật bài nộp' : 'Nộp'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubmissionButton;
