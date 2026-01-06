import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { coursesApi, CourseDTO } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface EditCourseForm {
  courseName: string;
  isPrivate: boolean;
  endDate?: string;
  oldPassword?: string;
  password?: string;
  confirmPassword?: string;
  courseDescription?: string;
}

interface EditCourseDialogProps {
  course: CourseDTO | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCourseUpdated: (updatedCourse: CourseDTO) => void;
}

const EditCourseDialog = ({ course, isOpen, onOpenChange, onCourseUpdated }: EditCourseDialogProps) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState<EditCourseForm | null>(null);

  useEffect(() => {
    if (course) {
      setFormData({
        courseName: course.courseName,
        isPrivate: course.isPrivate,
        endDate: course.endDate || '',
        courseDescription: course.courseDescription || '',
        oldPassword: '',
        password: '',
        confirmPassword: '',
      });
    } else {
      setFormData(null);
    }
  }, [course]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course?.id || !formData) return;

    setIsUpdating(true);
    try {
      const updated = await coursesApi.update(
        course.id,
        {
          courseName: formData.courseName,
          isPrivate: formData.isPrivate,
          endDate: formData.endDate || undefined,
          courseDescription: formData.courseDescription,
        },
        formData.oldPassword,
        formData.password,
        formData.confirmPassword
      );

      toast({ title: 'Cập nhật khóa học', description: updated.courseName });
      onCourseUpdated(updated);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Cập nhật thất bại',
        description: error.response?.data?.message || 'Không thể cập nhật khóa học',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const updateField = <K extends keyof EditCourseForm>(field: K, value: EditCourseForm[K]) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : prev);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa khóa học</DialogTitle>
            <DialogDescription>Cập nhật thông tin khóa học</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editCourseName">Tên khóa học</Label>
              <Input
                id="editCourseName"
                value={formData?.courseName || ''}
                onChange={(e) => updateField('courseName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCourseDescription">Mô tả khóa học</Label>
              <Textarea
                id="editCourseDescription"
                placeholder="Thêm mô tả cho khóa học..."
                value={formData?.courseDescription || ''}
                onChange={(e) => updateField('courseDescription', e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCourseEndDate">Ngày kết thúc (Tùy chọn)</Label>
              <Input
                id="editCourseEndDate"
                type="date"
                value={formData?.endDate || ''}
                onChange={(e) => updateField('endDate', e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isPrivate">Khóa học riêng tư</Label>
              <Switch
                id="isPrivate"
                checked={formData?.isPrivate || false}
                onCheckedChange={(checked) => updateField('isPrivate', checked)}
              />
            </div>
            {formData?.isPrivate && (
              <div className="space-y-2">
                <Label htmlFor="courseOldPassword">Mật khẩu cũ</Label>
                <Input
                  id="courseOldPassword"
                  type="password"
                  placeholder="Nhập mật khẩu cũ"
                  value={formData?.oldPassword || ''}
                  onChange={(e) => updateField('oldPassword', e.target.value)}
                  required={formData?.isPrivate}
                />
                <Label htmlFor="coursePassword">Mật khẩu khóa học</Label>
                <Input
                  id="coursePassword"
                  type="password"
                  placeholder="Nhập mật khẩu mới"
                  value={formData?.password || ''}
                  onChange={(e) => updateField('password', e.target.value)}
                  required={formData?.isPrivate}
                />
                <Label htmlFor="coursePasswordConfirm">Xác nhận mật khẩu</Label>
                <Input
                  id="coursePasswordConfirm"
                  type="password"
                  placeholder="Nhập lại mật khẩu mới"
                  value={formData?.confirmPassword || ''}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  required={formData?.isPrivate}
                />
              </div>
            )}
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

export default EditCourseDialog;
