import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { CourseDTO } from '@/lib/api';
import { useCourses, filterCourses } from '@/hooks/useCourses';
import {
  DashboardHeader,
  CourseSearchBar,
  CourseGrid,
  CreateCourseDialog,
  EditCourseDialog,
  EnrollCourseDialog,
  WithdrawCourseDialog,
  PrivacyFilter,
} from '@/components/dashboard';

const Dashboard = () => {
  const { user } = useAuth();
  const {
    courses,
    isLoading,
    enrolledCourseCodes,
    fetchCourses,
    searchCourses,
    enrollInCourse,
    withdrawFromCourse,
    updateCourseInList,
  } = useCourses(user?.username);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [privacyFilter, setPrivacyFilter] = useState<PrivacyFilter>('all');

  // Edit dialog state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseDTO | null>(null);

  // Enroll dialog state
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [enrollCourse, setEnrollCourse] = useState<{ id: number; code: string; name: string; isPrivate: boolean } | null>(null);

  // Withdraw dialog state
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawCourse, setWithdrawCourse] = useState<{ id: number; code: string; name: string } | null>(null);

  // Handle search
  const handleSearch = () => {
    searchCourses(searchQuery.trim() || undefined, privacyFilter);
  };

  // Auto-run search when privacy filter changes
  useEffect(() => {
    if (isLoading) return;
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privacyFilter]);

  // Handle enrollment
  const handleEnroll = (course: CourseDTO) => {
    if (course.isPrivate) {
      setEnrollCourse({ id: course.id, code: course.courseCode, name: course.courseName, isPrivate: true });
      setIsEnrollOpen(true);
    } else {
      enrollInCourse(course.id, undefined, course.courseCode);
    }
  };

  const handleEnrollWithPassword = async (courseId: number, password: string, courseCode: string) => {
    const success = await enrollInCourse(courseId, password, courseCode);
    if (success) {
      setIsEnrollOpen(false);
      setEnrollCourse(null);
    }
  };

  // Handle withdrawal
  const handleWithdraw = (course: CourseDTO) => {
    setWithdrawCourse({ id: course.id, code: course.courseCode, name: course.courseName });
    setIsWithdrawOpen(true);
  };

  const handleWithdrawConfirm = async (courseId: number, courseName: string, courseCode: string) => {
    const success = await withdrawFromCourse(courseId, courseName, courseCode);
    if (success) {
      setIsWithdrawOpen(false);
      setWithdrawCourse(null);
    }
  };

  // Handle edit
  const handleEdit = (course: CourseDTO) => {
    setEditingCourse(course);
    setIsEditOpen(true);
  };

  const handleCourseUpdated = (updatedCourse: CourseDTO) => {
    updateCourseInList(updatedCourse);
    fetchCourses();
  };

  // Filter courses locally
  const filteredCourses = filterCourses(courses, searchQuery);

  return (
    <MainLayout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <DashboardHeader />
          <CreateCourseDialog onCourseCreated={fetchCourses} />
        </div>

        {/* Search */}
        <CourseSearchBar
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          privacyFilter={privacyFilter}
          onPrivacyFilterChange={setPrivacyFilter}
          onSearch={handleSearch}
        />

        {/* Courses Grid */}
        <CourseGrid
          courses={filteredCourses}
          isLoading={isLoading}
          searchQuery={searchQuery}
          currentUsername={user?.username}
          enrolledCourseCodes={enrolledCourseCodes}
          onEnroll={handleEnroll}
          onWithdraw={handleWithdraw}
          onEdit={handleEdit}
        />

        {/* Edit Course Dialog */}
        <EditCourseDialog
          course={editingCourse}
          isOpen={isEditOpen}
          onOpenChange={setIsEditOpen}
          onCourseUpdated={handleCourseUpdated}
        />
      </div>

      {/* Withdraw Confirmation Modal */}
      <WithdrawCourseDialog
        course={withdrawCourse}
        isOpen={isWithdrawOpen}
        onOpenChange={setIsWithdrawOpen}
        onConfirm={handleWithdrawConfirm}
      />

      {/* Enroll Password Modal for Private Courses */}
      <EnrollCourseDialog
        course={enrollCourse}
        isOpen={isEnrollOpen}
        onOpenChange={setIsEnrollOpen}
        onEnroll={handleEnrollWithPassword}
      />
    </MainLayout>
  );
};

export default Dashboard;
