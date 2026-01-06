import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { assignmentsApi, Assignment } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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

  useEffect(() => {
    if (assignment) {
      setFormData({
        id: assignment.id,
        assignmentName: assignment.assignmentName,
        assignmentDue: assignment.assignmentDue,
        assignmentWeight: assignment.assignmentWeight,
      });
    } else {
      setFormData(null);
    }
  }, [assignment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setIsUpdating(true);
    try {
      const updated = await assignmentsApi.update(courseId, formData);
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
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa bài tập</DialogTitle>
            <DialogDescription>Chỉnh sửa thông tin bài tập</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
