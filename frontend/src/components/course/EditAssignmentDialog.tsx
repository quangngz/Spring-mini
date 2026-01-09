import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { assignmentsApi, Assignment } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, FileIcon, FileText } from 'lucide-react';
import { InlinePdfViewer } from '@/components/ui/pdf-viewer';

interface EditAssignmentForm {
  id: number;
  assignmentName: string;
  assignmentDue: string;
  assignmentWeight: number;
}

interface EditAssignmentDialogProps {
  assignment: Assignment | null;
  courseId: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAssignmentUpdated: () => void;
}

const EditAssignmentDialog = ({
  assignment,
  courseId,
  isOpen,
  onOpenChange,
  onAssignmentUpdated,
}: EditAssignmentDialogProps) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState<EditAssignmentForm | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [hasExistingPdf, setHasExistingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (assignment) {
      setFormData({
        id: assignment.id,
        assignmentName: assignment.assignmentName,
        assignmentDue: assignment.assignmentDue,
        assignmentWeight: assignment.assignmentWeight,
      });
      setSelectedFiles([]);
      setHasExistingPdf(true); // Will be set to false if PDF load fails
    } else {
      setFormData(null);
      setSelectedFiles([]);
      setHasExistingPdf(false);
    }
  }, [assignment]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedFiles(prev => [...prev, ...Array.from(files)]);
    }
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

  const fetchAssignmentPdf = useCallback(async (index: number) => {
    if (!assignment) throw new Error('No assignment');
    return assignmentsApi.getPdf(courseId, assignment.id, index);
  }, [courseId, assignment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !assignment) return;

    setIsUpdating(true);
    try {
      const updated = await assignmentsApi.update(courseId, assignment.id, {
        assignmentName: formData.assignmentName,
        assignmentDue: formData.assignmentDue,
        assignmentWeight: formData.assignmentWeight,
      }, selectedFiles.length > 0 ? selectedFiles : undefined);
      toast({ title: 'Cập nhật bài tập', description: updated.assignmentName });
      onAssignmentUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Cập nhật thất bại',
        description: error.response?.data?.message || 'Không thể cập nhật bài tập',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const updateField = <K extends keyof EditAssignmentForm>(field: K, value: EditAssignmentForm[K]) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : prev);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa bài tập</DialogTitle>
            <DialogDescription>Chỉnh sửa thông tin bài tập</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Existing PDF Viewer */}
            {assignment && hasExistingPdf && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Tệp đính kèm hiện tại
                </Label>
                <InlinePdfViewer
                  fetchPdf={fetchAssignmentPdf}
                  height="250px"
                  onError={() => setHasExistingPdf(false)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="editAssignmentName">Tên bài tập</Label>
              <Input
                id="editAssignmentName"
                value={formData?.assignmentName || ''}
                onChange={(e) => updateField('assignmentName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAssignmentDue">Hạn nộp</Label>
              <Input
                id="editAssignmentDue"
                type="datetime-local"
                value={formData?.assignmentDue || ''}
                onChange={(e) => updateField('assignmentDue', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAssignmentWeight">Trọng số (%)</Label>
              <Input
                id="editAssignmentWeight"
                type="number"
                min="0"
                max="100"
                value={formData?.assignmentWeight ?? 0}
                onChange={(e) => updateField('assignmentWeight', Number(e.target.value))}
                required
              />
            </div>

            {/* File Upload Section */}
            <div className="space-y-2">
              <Label>Thêm tệp mới (PDF)</Label>
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
                  accept=".pdf"
                />
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nhấp để chọn tệp PDF
                </p>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="space-y-2 mt-3">
                  <Label className="text-sm text-muted-foreground">
                    Đã chọn {selectedFiles.length} tệp mới
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAssignmentDialog;
