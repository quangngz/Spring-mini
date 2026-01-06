import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserCourse } from '@/lib/api';
import { Users, UserCheck } from 'lucide-react';

interface StudentsTabProps {
  enrollments: UserCourse[];
  isCreator: boolean;
  onPromoteTutor: (userId: number) => void;
}

const StudentsTab = ({ enrollments, isCreator, onPromoteTutor }: StudentsTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Học viên đã ghi danh</CardTitle>
        <CardDescription>Xem và quản lý việc ghi danh khóa học</CardDescription>
      </CardHeader>
      <CardContent>
        {enrollments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có học viên nào ghi danh</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên đăng nhập</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell className="font-medium">@{enrollment.username}</TableCell>
                  <TableCell>
                    <Badge variant={enrollment.role === 'TUTOR' ? 'default' : 'secondary'}>
                      {enrollment.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {isCreator && enrollment.role === 'STUDENT' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPromoteTutor(enrollment.userId)}
                        className="gap-1"
                      >
                        <UserCheck className="h-4 w-4" />
                        Thăng hạng thành Trợ giảng
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentsTab;
