import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { coursesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2 } from 'lucide-react';

interface CreateCourseDialogProps {
  onCourseCreated: () => void;
}

interface NewCourseForm {
  courseCode: string;
  courseName: string;
  isPrivate: boolean;
  endDate: string;
  password: string;
  confirmPassword: string;
}

const initialFormState: NewCourseForm = {
  courseCode: '',
  courseName: '',
  isPrivate: false,
  endDate: '',
  password: '',
  confirmPassword: '',
};

const CreateCourseDialog = ({ onCourseCreated }: CreateCourseDialogProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<NewCourseForm>(initialFormState);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.isPrivate) {
      if (!formData.password || !formData.confirmPassword) {
        toast({ title: 'Thiếu mật khẩu', description: 'Vui lòng nhập mật khẩu và xác nhận mật khẩu', variant: 'destructive' });
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast({ title: 'Mật khẩu không khớp', description: 'Vui lòng nhập lại để đảm bảo khớp', variant: 'destructive' });
        return;
      }
    }

    setIsCreating(true);
    try {
      const payload = {
        courseCode: formData.courseCode,
        courseName: formData.courseName,
        isPrivate: formData.isPrivate,
        endDate: formData.endDate || undefined,
        password: formData.isPrivate ? formData.password : undefined,
      };
      await coursesApi.create(payload as any);
      toast({
        title: 'Tạo khóa học thành công!',
        description: `${formData.courseName} đã được tạo`,
      });
      setIsOpen(false);
      setFormData(initialFormState);
      onCourseCreated();
    } catch (error: any) {
      toast({
        title: 'Tạo thất bại',
        description: error.response?.data?.message || 'Không thể tạo khóa học',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const updateField = <K extends keyof NewCourseForm>(field: K, value: NewCourseForm[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Tạo khóa học
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Tạo khóa học mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin để tạo khóa học mới
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="courseCode">Mã khóa học</Label>
              <Input
                id="courseCode"
                placeholder="CS101"
                value={formData.courseCode}
                onChange={(e) => updateField('courseCode', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courseName">Tên khóa học</Label>
              <Input
                id="courseName"
                placeholder="Nhập môn Khoa học máy tính"
                value={formData.courseName}
                onChange={(e) => updateField('courseName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Ngày kết thúc (Tùy chọn)</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => updateField('endDate', e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isPrivate">Khóa học riêng tư</Label>
              <Switch
                id="isPrivate"
                checked={formData.isPrivate}
                onCheckedChange={(checked) => updateField('isPrivate', checked)}
              />
            </div>
            {formData.isPrivate && (
              <div className="space-y-2">
                <Label htmlFor="coursePassword">Mật khẩu khóa học</Label>
                <Input
                  id="coursePassword"
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  required={formData.isPrivate}
                />
                <Label htmlFor="coursePasswordConfirm">Xác nhận mật khẩu</Label>
                <Input
                  id="coursePasswordConfirm"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  required={formData.isPrivate}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                'Tạo khóa học'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCourseDialog;
