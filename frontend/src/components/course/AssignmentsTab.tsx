import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Assignment } from '@/lib/api';
import { GraduationCap } from 'lucide-react';
import SubmissionButton from '@/components/submission/SubmissionButton';
import CreateAssignmentDialog from './CreateAssignmentDialog';

interface AssignmentsTabProps {
  assignments: Assignment[];
  courseId: number;
  isCreator: boolean;
  isTutor: boolean;
  onAssignmentCreated: () => void;
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignmentId: number) => void;
  onViewSubmissions: (assignment: Assignment) => void;
}

const AssignmentsTab = ({
  assignments,
  courseId,
  isCreator,
  isTutor,
  onAssignmentCreated,
  onEditAssignment,
  onDeleteAssignment,
  onViewSubmissions,
}: AssignmentsTabProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Bài tập</CardTitle>
          <CardDescription>Quản lý bài tập và hạn nộp</CardDescription>
        </div>
        <CreateAssignmentDialog courseId={courseId} onAssignmentCreated={onAssignmentCreated} />
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có bài tập nào</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bài tập</TableHead>
                <TableHead>Hạn nộp</TableHead>
                <TableHead>Trọng số</TableHead>
                <TableHead>Tạo bởi</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">{assignment.assignmentName}</TableCell>
                  <TableCell>
                    {new Date(assignment.assignmentDue).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{assignment.assignmentWeight}%</Badge>
                  </TableCell>
                  <TableCell className="flex items-center gap-2 justify-between">
                    <span>{assignment.createdBy}</span>
                    {isCreator && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => onEditAssignment(assignment)}>
                          Chỉnh sửa
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => onDeleteAssignment(assignment.id)}>
                          Xóa
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isTutor && (
                        <Button size="sm" variant="outline" onClick={() => onViewSubmissions(assignment)}>
                          Xem bài nộp
                        </Button>
                      )}
                      <SubmissionButton assignment={assignment} courseId={courseId} buttonSize="sm" />
                    </div>
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

export default AssignmentsTab;
