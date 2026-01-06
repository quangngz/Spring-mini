import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Loader2 } from 'lucide-react';
import { CourseDTO } from '@/lib/api';
import CourseCard from './CourseCard';

interface CourseGridProps {
  courses: CourseDTO[];
  isLoading: boolean;
  searchQuery: string;
  currentUsername?: string;
  enrolledCourseCodes: Set<string>;
  onEnroll: (course: CourseDTO) => void;
  onWithdraw: (course: CourseDTO) => void;
  onEdit: (course: CourseDTO) => void;
}

const CourseGrid = ({
  courses,
  isLoading,
  searchQuery,
  currentUsername,
  enrolledCourseCodes,
  onEnroll,
  onWithdraw,
  onEdit,
}: CourseGridProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <Card className="py-16">
        <CardContent className="text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Không tìm thấy khóa học</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Hãy thử từ khóa khác' : 'Tạo khóa học đầu tiên để bắt đầu'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course, index) => (
        <CourseCard
          key={course.id}
          course={course}
          index={index}
          isCreator={currentUsername === course.createdBy}
          isEnrolled={enrolledCourseCodes.has(course.courseCode)}
          onEnroll={onEnroll}
          onWithdraw={onWithdraw}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};

export default CourseGrid;
