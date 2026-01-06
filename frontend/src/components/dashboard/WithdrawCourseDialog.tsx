import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface WithdrawCourseInfo {
  id: number;
  code: string;
  name: string;
}

interface WithdrawCourseDialogProps {
  course: WithdrawCourseInfo | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (courseId: number, courseName: string, courseCode: string) => void;
}

const WithdrawCourseDialog = ({ course, isOpen, onOpenChange, onConfirm }: WithdrawCourseDialogProps) => {
  const handleConfirm = () => {
    if (course) {
      onConfirm(course.id, course.name, course.code);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận rời khóa học</DialogTitle>
          <DialogDescription>
            {course ? (
              <>Bạn có muốn rời khỏi khóa học "{course.name}"?</>
            ) : (
              'Bạn có muốn rời khỏi khóa học này?'
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Không
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Có
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawCourseDialog;
