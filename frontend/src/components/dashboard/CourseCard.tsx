import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Lock, Unlock, Calendar } from 'lucide-react';
import { CourseDTO } from '@/lib/api';

interface CourseCardProps {
  course: CourseDTO;
  index: number;
  isCreator: boolean;
  isEnrolled: boolean;
  onEnroll: (course: CourseDTO) => void;
  onWithdraw: (course: CourseDTO) => void;
  onEdit: (course: CourseDTO) => void;
}

const CourseCard = ({
  course,
  index,
  isCreator,
  isEnrolled,
  onEnroll,
  onWithdraw,
  onEdit,
}: CourseCardProps) => {
  return (
    <Card
      className="group hover:shadow-card-hover transition-all duration-300 animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <Badge variant={course.isPrivate ? 'secondary' : 'outline'} className="gap-1">
            {course.isPrivate ? (
              <>
                <Lock className="h-3 w-3" />
                Riêng tư
              </>
            ) : (
              <>
                <Unlock className="h-3 w-3" />
                Công khai
              </>
            )}
          </Badge>
        </div>
        <CardTitle className="mt-4 group-hover:text-primary transition-colors">
          {course.courseName}
        </CardTitle>
        <CardDescription className="flex items-center gap-4">
          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
            {course.courseCode}
          </span>
          <span className="flex items-center gap-1 text-xs">
            <Users className="h-3 w-3" />
            {course.createdBy}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {course.endDate && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Kết thúc: {new Date(course.endDate).toLocaleDateString()}
          </p>
        )}
      </CardContent>
      <CardFooter className="gap-2">
        {/* View details button - only for enrolled users or creator */}
        {(isEnrolled || isCreator) && course.id && (
          <Link to={`/courses/${course.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              Xem chi tiết
            </Button>
          </Link>
        )}
        {/* Enroll or Withdraw button */}
        {course.courseCode && !isCreator && (
          isEnrolled ? (
            <Button variant="destructive" onClick={() => onWithdraw(course)}>
              Rời khóa học
            </Button>
          ) : (
            <Button onClick={() => onEnroll(course)}>
              Ghi danh
            </Button>
          )
        )}
        {isCreator && (
          <Button variant="secondary" onClick={() => onEdit(course)}>
            Chỉnh sửa
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
