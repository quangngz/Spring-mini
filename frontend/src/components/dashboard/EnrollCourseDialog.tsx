import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EnrollCourseInfo {
  id: number;
  code: string;
  name: string;
  isPrivate: boolean;
}

interface EnrollCourseDialogProps {
  course: EnrollCourseInfo | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEnroll: (courseId: number, password: string, courseCode: string) => void;
}

const EnrollCourseDialog = ({ course, isOpen, onOpenChange, onEnroll }: EnrollCourseDialogProps) => {
  const [password, setPassword] = useState('');

  const handleEnroll = () => {
    if (course) {
      onEnroll(course.id, password, course.code);
      setPassword('');
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setPassword('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nhập mật khẩu khóa học</DialogTitle>
          <DialogDescription>
            {course ? (
              <>Vui lòng nhập mật khẩu để ghi danh vào "{course.name}"</>
            ) : (
              'Vui lòng nhập mật khẩu khóa học'
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label htmlFor="enrollPassword">Mật khẩu</Label>
          <Input
            id="enrollPassword"
            type="password"
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleEnroll} disabled={!password}>
            Ghi danh
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnrollCourseDialog;
