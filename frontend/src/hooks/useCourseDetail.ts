import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { coursesApi, assignmentsApi, enrollmentApi, submissionsApi, CourseDTO, Assignment, UserCourse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const useCourseDetail = (courseId: string | undefined, username?: string) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [course, setCourse] = useState<CourseDTO | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [enrollments, setEnrollments] = useState<UserCourse[]>([]);
  const [cumulativeWeight, setCumulativeWeight] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isCreator = username === course?.createdBy;
  const isTutor = isCreator || enrollments.some((e) => e.username === username && e.role === 'TUTOR');

  const fetchData = useCallback(async () => {
    if (!courseId || Number.isNaN(Number(courseId))) {
      toast({
        title: 'URL khóa học không hợp lệ',
        description: 'Thiếu hoặc sai courseId trong URL',
        variant: 'destructive',
      });
      navigate('/dashboard');
      return;
    }

    try {
      const id = Number(courseId);
      const courseData = await coursesApi.getById(id);
      const [assignmentsData, enrollmentsData, cumWeight] = await Promise.all([
        assignmentsApi.getAll(id),
        coursesApi.getEnrollments(id),
        submissionsApi.getCumulativeWeight(id).catch(() => null),
      ]);
      setCourse(courseData);
      setAssignments(assignmentsData || []);
      setEnrollments(enrollmentsData || []);
      setCumulativeWeight(cumWeight);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể lấy chi tiết khóa học',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [courseId, navigate, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshAssignments = useCallback(async () => {
    if (!course?.id) return;
    try {
      const fresh = await assignmentsApi.getAll(course.id);
      setAssignments(fresh || []);
    } catch (error) {
      // Silently fail
    }
  }, [course?.id]);

  const refreshEnrollments = useCallback(async () => {
    if (!course?.id) return;
    try {
      const updated = await coursesApi.getEnrollments(course.id);
      setEnrollments(updated || []);
    } catch (error) {
      // Silently fail
    }
  }, [course?.id]);

  const deleteAssignment = useCallback(async (assignmentId: number) => {
    if (!course?.id) return;
    try {
      await assignmentsApi.delete(course.id, assignmentId);
      toast({ title: 'Đã xóa bài tập' });
      await refreshAssignments();
    } catch (error: any) {
      toast({
        title: 'Xóa thất bại',
        description: error.response?.data?.message || 'Không thể xóa bài tập',
        variant: 'destructive',
      });
    }
  }, [course?.id, toast, refreshAssignments]);

  const promoteTutor = useCallback(async (userId: number) => {
    if (!course?.id) return;
    try {
      await enrollmentApi.promoteTutor(course.id, userId);
      toast({ title: 'Đã thăng hạng người dùng thành Trợ giảng' });
      await refreshEnrollments();
    } catch (error: any) {
      toast({
        title: 'Thăng hạng thất bại',
        description: error.response?.data?.message,
        variant: 'destructive',
      });
    }
  }, [course?.id, toast, refreshEnrollments]);

  const deleteCourse = useCallback(async () => {
    if (!course?.id) return;
    try {
      await coursesApi.delete(course.id);
      toast({ title: 'Đã xóa khóa học' });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Xóa thất bại',
        description: error.response?.data?.message,
        variant: 'destructive',
      });
    }
  }, [course?.id, toast, navigate]);

  const updateCourse = useCallback((updatedCourse: CourseDTO) => {
    setCourse(updatedCourse);
  }, []);

  return {
    course,
    assignments,
    enrollments,
    cumulativeWeight,
    isLoading,
    isCreator,
    isTutor,
    refreshAssignments,
    refreshEnrollments,
    deleteAssignment,
    promoteTutor,
    deleteCourse,
    updateCourse,
  };
};
