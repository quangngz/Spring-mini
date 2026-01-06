import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { assignmentsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2 } from 'lucide-react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await assignmentsApi.create(courseId, formData);
      toast({
        title: 'Tạo bài tập thành công!',
        description: `${formData.assignmentName} đã được thêm`,
      });
      setIsOpen(false);
      setFormData(initialFormState);
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
