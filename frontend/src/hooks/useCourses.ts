import { useState, useEffect, useCallback } from 'react';
import { coursesApi, enrollmentApi, CourseDTO } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { PrivacyFilter } from '@/components/dashboard/CourseSearchBar';

export const useCourses = (username?: string) => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enrolledCourseCodes, setEnrolledCourseCodes] = useState<Set<string>>(new Set());

  const refreshEnrollments = useCallback(async (coursesList: CourseDTO[]) => {
    if (!username) return;
    try {
      const results = await Promise.all((coursesList || []).map(async (course) => {
        const code = course?.courseCode || '';
        if (!code) return { code, enrolled: false };
        const creatorEnrolled = username === course.createdBy;
        try {
          const enrollments = await coursesApi.getEnrollments(course.id);
          const userEnrolled = Array.isArray(enrollments) && enrollments.some((e) => e?.username === username);
          return { code, enrolled: creatorEnrolled || userEnrolled };
        } catch {
          return { code, enrolled: creatorEnrolled };
        }
      }));
      const next = new Set<string>();
      results.forEach((r) => { if (r.enrolled && r.code) next.add(r.code); });
      setEnrolledCourseCodes(next);
    } catch {
      // ignore refresh errors
    }
  }, [username]);

  const fetchCourses = useCallback(async () => {
    try {
      const data = await coursesApi.getAll();
      const list = Array.isArray(data) ? data : [];
      setCourses(list);
      await refreshEnrollments(list);
    } catch {
      toast({
        title: 'Lỗi',
        description: 'Không thể lấy danh sách khóa học',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, refreshEnrollments]);

  const searchCourses = useCallback(async (query?: string, privacyFilter?: PrivacyFilter) => {
    setIsLoading(true);
    try {
      const isPrivateParam = privacyFilter === 'all' ? null : privacyFilter === 'private';
      const data = await coursesApi.search(query || undefined, isPrivateParam);
      const list = Array.isArray(data) ? data : [];
      setCourses(list);
      await refreshEnrollments(list);
    } catch {
      toast({
        title: 'Tìm kiếm thất bại',
        description: 'Không thể tìm kiếm khóa học',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, refreshEnrollments]);

  const enrollInCourse = useCallback(async (courseId: number, password?: string, courseCode?: string) => {
    try {
      await enrollmentApi.enroll(courseId, password);
      toast({
        title: 'Đã ghi danh!',
        description: courseCode ? `Bạn đã ghi danh vào ${courseCode}` : 'Bạn đã ghi danh vào khóa học',
      });
      if (courseCode) {
        setEnrolledCourseCodes((prev) => {
          const next = new Set(prev);
          next.add(courseCode);
          return next;
        });
      }
      return true;
    } catch (error: any) {
      toast({
        title: 'Ghi danh thất bại',
        description: error.response?.data?.message || 'Không thể ghi danh khóa học',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const withdrawFromCourse = useCallback(async (courseId: number, courseName: string, courseCode?: string) => {
    try {
      await enrollmentApi.withdraw(courseId);
      toast({
        title: 'Đã rời khóa học',
        description: `Bạn đã rời khỏi ${courseName}`,
      });
      if (courseCode) {
        setEnrolledCourseCodes((prev) => {
          const next = new Set(prev);
          next.delete(courseCode);
          return next;
        });
      }
      return true;
    } catch (error: any) {
      toast({
        title: 'Rời khóa học thất bại',
        description: error.response?.data?.message || 'Không thể rời khóa học',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const updateCourseInList = useCallback((updatedCourse: CourseDTO) => {
    setCourses((prev) => prev.map((c) => (c.courseCode === updatedCourse.courseCode ? updatedCourse : c)));
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return {
    courses,
    isLoading,
    enrolledCourseCodes,
    fetchCourses,
    searchCourses,
    enrollInCourse,
    withdrawFromCourse,
    updateCourseInList,
  };
};

export const filterCourses = (courses: CourseDTO[], searchQuery: string): CourseDTO[] => {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  return (Array.isArray(courses) ? courses : []).filter((course) => {
    if (!normalizedQuery) return true;
    const name = (course?.courseName ?? '').toString().toLowerCase();
    const code = (course?.courseCode ?? '').toString().toLowerCase();
    const createdBy = (course?.createdBy ?? '').toString().toLowerCase();
    return (
      name.includes(normalizedQuery) ||
      code.includes(normalizedQuery) ||
      createdBy.includes(normalizedQuery)
    );
  });
};
