import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CourseDTO, UserCourse } from '@/lib/api';
import { ArrowLeft, BookOpen, Users, Calendar, Lock, Unlock, Trash2 } from 'lucide-react';

interface CourseHeaderProps {
  course: CourseDTO;
  enrollmentsCount: number;
  isCreator: boolean;
  onDeleteCourse: () => void;
  onEditCourse: () => void;
}

const CourseHeader = ({
  course,
  enrollmentsCount,
  isCreator,
  onDeleteCourse,
  onEditCourse,
}: CourseHeaderProps) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Quay lại Khóa học
      </Button>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl gradient-primary">
            <BookOpen className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">{course.courseName}</h1>
              <Badge variant={course.isPrivate ? 'secondary' : 'outline'}>
                {course.isPrivate ? <Lock className="h-3 w-3 mr-1" /> : <Unlock className="h-3 w-3 mr-1" />}
                {course.isPrivate ? 'Riêng tư' : 'Công khai'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{course.courseCode}</span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {enrollmentsCount} đã ghi danh
              </span>
              {course.endDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Kết thúc {new Date(course.endDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {isCreator && (
          <div className="flex gap-2">
            <Button variant="destructive" onClick={onDeleteCourse} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Xóa khóa học
            </Button>
            <Button variant="secondary" className="gap-2" onClick={onEditCourse}>
              Chỉnh sửa khóa học
            </Button>
          </div>
        )}
      </div>

      {course.courseDescription && (
        <div className="mb-6 text-muted-foreground whitespace-pre-wrap">
          {course.courseDescription}
        </div>
      )}
    </>
  );
};

export default CourseHeader;
