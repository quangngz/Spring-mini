import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { assignmentsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, Upload, X, FileIcon } from 'lucide-react';

interface NewAssignmentForm {
  assignmentName: string;
  assignmentDue: string;
  assignmentWeight: number;
}

const initialFormState: NewAssignmentForm = {
  assignmentName: '',
  assignmentDue: '',
  assignmentWeight: 10,
};

interface CreateAssignmentDialogProps {
  courseId: number;
  onAssignmentCreated: () => void;
}

const CreateAssignmentDialog = ({ courseId, onAssignmentCreated }: CreateAssignmentDialogProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<NewAssignmentForm>(initialFormState);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await assignmentsApi.create(courseId, formData, selectedFiles.length > 0 ? selectedFiles : undefined);
      toast({
        title: 'Tạo bài tập thành công!',
        description: `${formData.assignmentName} đã được thêm`,
      });
      setIsOpen(false);
      setFormData(initialFormState);
      setSelectedFiles([]);
      onAssignmentCreated();
    } catch (error: any) {
      toast({
        title: 'Tạo thất bại',
        description: error.response?.data?.message || 'Không thể tạo bài tập',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const updateField = <K extends keyof NewAssignmentForm>(field: K, value: NewAssignmentForm[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm bài tập
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Tạo bài tập</DialogTitle>
            <DialogDescription>Thêm bài tập mới cho khóa học này</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assignmentName">Tên bài tập</Label>
              <Input
                id="assignmentName"
                value={formData.assignmentName}
                onChange={(e) => updateField('assignmentName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignmentDue">Hạn nộp</Label>
              <Input
                id="assignmentDue"
                type="datetime-local"
                value={formData.assignmentDue}
                onChange={(e) => updateField('assignmentDue', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignmentWeight">Trọng số (%)</Label>
              <Input
                id="assignmentWeight"
                type="number"
                min="0"
                max="100"
                value={formData.assignmentWeight}
                onChange={(e) => updateField('assignmentWeight', Number(e.target.value))}
                required
              />
            </div>

            {/* File Upload Section */}
            <div className="space-y-2">
              <Label>Tệp đính kèm (PDF)</Label>
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
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tạo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAssignmentDialog;
