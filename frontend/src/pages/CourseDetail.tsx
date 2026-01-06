import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Assignment } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, GraduationCap, Users } from 'lucide-react';
import ViewSubmissionsDialog from '@/components/submission/ViewSubmissionsDialog';
import { useCourseDetail } from '@/hooks/useCourseDetail';
import {
  CourseHeader,
  AssignmentsTab,
  StudentsTab,
  EditAssignmentDialog,
  EditCourseDialog,
} from '@/components/course';

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();

  const {
    course,
    assignments,
    enrollments,
    isLoading,
    isCreator,
    isTutor,
    refreshAssignments,
    deleteAssignment,
    promoteTutor,
    deleteCourse,
    updateCourse,
  } = useCourseDetail(courseId, user?.username);

  // Edit assignment dialog state
  const [isEditAssignmentOpen, setIsEditAssignmentOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  // Edit course dialog state
  const [isEditCourseOpen, setIsEditCourseOpen] = useState(false);

  // View submissions dialog state
  const [isViewSubsOpen, setIsViewSubsOpen] = useState(false);
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setIsEditAssignmentOpen(true);
  };

  const handleViewSubmissions = (assignment: Assignment) => {
    setViewingAssignment(assignment);
    setIsViewSubsOpen(true);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!course) {
    return (
      <MainLayout>
        <div className="container py-8 text-center">
          <h1 className="text-2xl font-bold">Không tìm thấy khóa học</h1>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8">
        {/* Header */}
        <CourseHeader
          course={course}
          enrollmentsCount={enrollments.length}
          isCreator={isCreator}
          onDeleteCourse={deleteCourse}
          onEditCourse={() => setIsEditCourseOpen(true)}
        />

        {/* Tabs */}
        <Tabs defaultValue="assignments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="assignments" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Bài tập
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-2">
              <Users className="h-4 w-4" />
              Học viên
            </TabsTrigger>
          </TabsList>

          {/* Assignments Tab */}
          <TabsContent value="assignments">
            <AssignmentsTab
              assignments={assignments}
              courseId={course.id}
              isCreator={isCreator}
              isTutor={isTutor}
              onAssignmentCreated={refreshAssignments}
              onEditAssignment={handleEditAssignment}
              onDeleteAssignment={deleteAssignment}
              onViewSubmissions={handleViewSubmissions}
            />
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
            <StudentsTab
              enrollments={enrollments}
              isCreator={isCreator}
              onPromoteTutor={promoteTutor}
            />
          </TabsContent>
        </Tabs>

        {/* Edit Assignment Dialog */}
        <EditAssignmentDialog
          assignment={editingAssignment}
          courseId={course.id}
          isOpen={isEditAssignmentOpen}
          onOpenChange={setIsEditAssignmentOpen}
          onAssignmentUpdated={refreshAssignments}
        />

        {/* Edit Course Dialog */}
        <EditCourseDialog
          course={course}
          isOpen={isEditCourseOpen}
          onOpenChange={setIsEditCourseOpen}
          onCourseUpdated={updateCourse}
        />

        {/* View Submissions Dialog */}
        <ViewSubmissionsDialog
          open={isViewSubsOpen}
          onOpenChange={setIsViewSubsOpen}
          assignment={viewingAssignment}
          courseId={Number(courseId)}
        />
      </div>
    </MainLayout>
  );
};

export default CourseDetail;
