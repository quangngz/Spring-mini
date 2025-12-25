import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { coursesApi, assignmentsApi, enrollmentApi, submissionsApi, CourseDTO, Assignment, UserCourse, Submission } from '@/lib/api';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, BookOpen, Users, Calendar, Lock, Unlock, Plus, Loader2, Trash2, GraduationCap, UserCheck, Send } from 'lucide-react';

const CourseDetail = () => {
  const { courseCode } = useParams<{ courseCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<CourseDTO | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [enrollments, setEnrollments] = useState<UserCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    assignmentName: '',
    assignmentDue: '',
    assignmentWeight: 10,
  });
  const [isEditAssignmentOpen, setIsEditAssignmentOpen] = useState(false);
  const [isUpdatingAssignment, setIsUpdatingAssignment] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<{
    id: number;
    assignmentName: string;
    assignmentDue: string;
    assignmentWeight: number;
  } | null>(null);
  const [isEditCourseOpen, setIsEditCourseOpen] = useState(false);
  const [isUpdatingCourse, setIsUpdatingCourse] = useState(false);
  const [editCourse, setEditCourse] = useState<{ courseName: string; isPrivate: boolean; 
    endDate?: string ; oldPassword?: string; password?: string; confirmPassword?: string; courseDescription?: string } | null>(null);

  // Submission dialog state
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionContent, setSubmissionContent] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);

  // View submissions dialog state
  const [isViewSubsOpen, setIsViewSubsOpen] = useState(false);
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [isLoadingSubs, setIsLoadingSubs] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    if (!courseCode) {
      toast({
        title: 'URL khóa học không hợp lệ',
        description: 'Không có mã khóa học trong URL',
        variant: 'destructive',
      });
      navigate('/dashboard');
      return;
    }
    
    const fetchData = async () => {
      try {
        const [courseData, assignmentsData, enrollmentsData] = await Promise.all([
          coursesApi.getByCode(courseCode),
          assignmentsApi.getAll(courseCode),
          coursesApi.getEnrollments(courseCode),
        ]);
        setCourse(courseData);
        setAssignments(assignmentsData || []);
        setEnrollments(enrollmentsData || []);
      } catch (error) {
        toast({
          title: 'Lỗi',
          description: 'Không thể lấy chi tiết khóa học',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [courseCode]);

  const isCreator = user?.username === course?.createdBy;
  const isTutor = isCreator || enrollments.some((e) => e.username === user?.username && e.role === 'TUTOR');

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode) return;
    
    setIsCreatingAssignment(true);
    try {
      const created = await assignmentsApi.create(courseCode, newAssignment);
      // Re-fetch assignments to verify persistence in DB
      const freshAssignments = await assignmentsApi.getAll(courseCode);
      setAssignments(freshAssignments || []);
      toast({
        title: 'Tạo bài tập thành công!',
        description: `${newAssignment.assignmentName} đã được thêm`,
      });
      setIsCreateAssignmentOpen(false);
      setNewAssignment({ assignmentName: '', assignmentDue: '', assignmentWeight: 10 });
    } catch (error: any) {
      toast({
        title: 'Tạo thất bại',
        description: error.response?.data?.message || 'Không thể tạo bài tập',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingAssignment(false);
    }
  };

  const openEditAssignment = (assignment: Assignment) => {
    setEditingAssignment({
      id: assignment.id,
      assignmentName: assignment.assignmentName,
      assignmentDue: assignment.assignmentDue,
      assignmentWeight: assignment.assignmentWeight,
    });
    setIsEditAssignmentOpen(true);
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode || !editingAssignment) return;
    setIsUpdatingAssignment(true);
    try {
      const updated = await assignmentsApi.update(courseCode, editingAssignment);
      toast({ title: 'Cập nhật bài tập', description: updated.assignmentName });
      const fresh = await assignmentsApi.getAll(courseCode);
      setAssignments(fresh || []);
      setIsEditAssignmentOpen(false);
      setEditingAssignment(null);
    } catch (error: any) {
      toast({
        title: 'Cập nhật thất bại',
        description: error.response?.data?.message || 'Không thể cập nhật bài tập',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingAssignment(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!courseCode) return;
    try {
      await assignmentsApi.delete(courseCode, assignmentId);
      toast({ title: 'Đã xóa bài tập' });
      const fresh = await assignmentsApi.getAll(courseCode);
      setAssignments(fresh || []);
    } catch (error: any) {
      toast({
        title: 'Xóa thất bại',
        description: error.response?.data?.message || 'Không thể xóa bài tập',
        variant: 'destructive',
      });
    }
  };

  const openEditCourse = () => {
    if (!course) return;
    setEditCourse({ courseName: course.courseName, isPrivate: course.isPrivate, endDate: course.endDate || '', courseDescription: course.courseDescription || '' });
    setIsEditCourseOpen(true);
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode || !editCourse) return;
    setIsUpdatingCourse(true);
    try {
      const updated = await coursesApi.update(courseCode, {
        courseName: editCourse.courseName,
        isPrivate: editCourse.isPrivate,
        endDate: editCourse.endDate || undefined,
        courseDescription: editCourse.courseDescription,
      }, editCourse.oldPassword, editCourse.password, editCourse.confirmPassword);

      toast({ title: 'Cập nhật khóa học', description: updated.courseName });
      setCourse(updated);
      setIsEditCourseOpen(false);
    } catch (error: any) {
      toast({
        title: 'Cập nhật thất bại',
        description: error.response?.data?.message || 'Không thể cập nhật khóa học',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingCourse(false);
    }
  };

  const handlePromoteTutor = async (userId: number) => {
    if (!courseCode) return;
    try {
      await enrollmentApi.promoteTutor(courseCode, userId);
      toast({ title: 'Đã thăng hạng người dùng thành Trợ giảng' });
      const updated = await coursesApi.getEnrollments(courseCode);
      setEnrollments(updated || []);
    } catch (error: any) {
      toast({
        title: 'Thăng hạng thất bại',
        description: error.response?.data?.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseCode) return;
    try {
      await coursesApi.delete(courseCode);
      toast({ title: 'Đã xóa khóa học' });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Xóa thất bại',
        description: error.response?.data?.message,
        variant: 'destructive',
      });
    }
  };

  const openSubmitDialog = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionContent('');
    setSelectedSubmissionId(null);
    if (!courseCode || !user?.username) {
      toast({ title: 'Không thể mở chỉnh sửa', description: 'Thiếu thông tin người dùng hoặc khóa học', variant: 'destructive' });
      return;
    }
    try {
      const rows = await submissionsApi.getByAssignment(assignment.id);
      const mine = rows.find((s) => s.username === user.username);
      if (!mine) {
        toast({ title: 'Chưa có bài nộp', description: 'Bạn chưa nộp bài để chỉnh sửa', variant: 'destructive' });
        return;
      }
      setSelectedSubmissionId(mine.id);
      setSubmissionContent(mine.content ?? '');
      setIsSubmitOpen(true);
    } catch (error: any) {
      toast({ title: 'Không thể tải bài nộp', description: error.response?.data?.message || 'Vui lòng thử lại sau', variant: 'destructive' });
    }
  };

  const openViewSubmissions = async (assignment: Assignment) => {
    if (!courseCode) return;
    setViewingAssignment(assignment);
    setIsViewSubsOpen(true);
    setIsLoadingSubs(true);
    try {
      const rows = await submissionsApi.getByAssignment(assignment.id);
      setSubmissions(rows || []);
    } catch (error: any) {
      toast({ title: 'Không thể tải bài nộp', description: error.response?.data?.message, variant: 'destructive' });
    } finally {
      setIsLoadingSubs(false);
    }
  };

  const handleEditSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmissionId) {
      toast({ title: 'Không tìm thấy bài nộp', description: 'Không thể chỉnh sửa vì thiếu mã bài nộp', variant: 'destructive' });
      return;
    }
    if (!submissionContent.trim()) {
      toast({ title: 'Nội dung trống', description: 'Vui lòng nhập nội dung trước khi nộp', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await submissionsApi.edit(selectedSubmissionId, submissionContent.trim());
      toast({ title: 'Cập nhật bài nộp thành công', description: selectedAssignment?.assignmentName });
      setIsSubmitOpen(false);
      setSubmissionContent('');
      setSelectedAssignment(null);
      setSelectedSubmissionId(null);
    } catch (error: any) {
      toast({
        title: 'Chỉnh sửa thất bại',
        description: error.response?.data?.message || 'Không thể chỉnh sửa bài nộp',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
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
                  {enrollments.length} đã ghi danh
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
            <Button variant="destructive" onClick={handleDeleteCourse} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Xóa khóa học
            </Button>
          )}
          {isCreator && (
            <Dialog open={isEditCourseOpen} onOpenChange={setIsEditCourseOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="gap-2 ml-2" onClick={openEditCourse}>
                  Chỉnh sửa khóa học
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleUpdateCourse}>
                  <DialogHeader>
                    <DialogTitle>Chỉnh sửa khóa học</DialogTitle>
                    <DialogDescription>Cập nhật thông tin khóa học</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="editCourseName">Tên khóa học</Label>
                      <Input
                        id="editCourseName"
                        value={editCourse?.courseName || ''}
                        onChange={(e) => setEditCourse(prev => prev ? { ...prev, courseName: e.target.value } : prev)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editCourseDescription">Mô tả khóa học</Label>
                      <Textarea
                        id="editCourseDescription"
                        placeholder="Thêm mô tả cho khóa học..."
                        value={editCourse?.courseDescription || ''}
                        onChange={(e) => setEditCourse(prev => prev ? { ...prev, courseDescription: e.target.value } : prev)}
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editCourseEndDate">Ngày kết thúc (Tùy chọn)</Label>
                      <Input
                        id="editCourseEndDate"
                        type="date"
                        value={editCourse?.endDate || ''}
                        onChange={(e) => setEditCourse(prev => prev ? { ...prev, endDate: e.target.value } : prev)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="isPrivate">Khóa học riêng tư</Label>
                      <Switch
                        id="isPrivate"
                        checked={editCourse?.isPrivate || false}
                        onCheckedChange={(checked) => setEditCourse(prev => prev ? { ...prev, isPrivate: checked } : prev)}
                      />
                    </div>
                    {editCourse?.isPrivate && (
                    <div className="space-y-2">
                      <Label htmlFor="courseOldPassword">Mật khẩu cũ</Label>
                      <Input
                        id="courseOldPassword"
                        type="password"
                        placeholder="Nhập mật khẩu cũ"
                        value={editCourse?.oldPassword || ''}
                        onChange={(e) => setEditCourse(prev => prev ? { ...prev, oldPassword: e.target.value } : prev)}
                        required={editCourse?.isPrivate}
                      />
                      <Label htmlFor="coursePassword">Mật khẩu khóa học</Label>
                      <Input
                        id="coursePassword"
                        type="password"
                        placeholder="Nhập mật khẩu mới"
                        value={editCourse?.password || ''}
                        onChange={(e) => setEditCourse(prev => prev ? { ...prev, password: e.target.value } : prev)}
                        required={editCourse?.isPrivate}
                      />
                      <Label htmlFor="coursePasswordConfirm">Xác nhận mật khẩu</Label>
                      <Input
                        id="coursePasswordConfirm"
                        type="password"
                        placeholder="Nhập lại mật khẩu mới"
                        value={editCourse?.confirmPassword || ''}
                        onChange={(e) => setEditCourse(prev => prev ? { ...prev, confirmPassword: e.target.value } : prev)}
                        required={editCourse?.isPrivate}
                      />
                    </div>
                  )}
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsEditCourseOpen(false)}>
                      Hủy
                    </Button>
                    <Button type="submit" disabled={isUpdatingCourse}>
                      {isUpdatingCourse ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lưu thay đổi'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {course.courseDescription && (
          <div className="mb-6 text-muted-foreground whitespace-pre-wrap">
            {course.courseDescription}
          </div>
        )}

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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Bài tập</CardTitle>
                  <CardDescription>Quản lý bài tập và hạn nộp</CardDescription>
                </div>
                <Dialog open={isCreateAssignmentOpen} onOpenChange={setIsCreateAssignmentOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Thêm bài tập
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleCreateAssignment}>
                      <DialogHeader>
                        <DialogTitle>Tạo bài tập</DialogTitle>
                        <DialogDescription>Thêm bài tập mới cho khóa học này</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="assignmentName">Tên bài tập</Label>
                          <Input
                            id="assignmentName"
                            value={newAssignment.assignmentName}
                            onChange={(e) => setNewAssignment(prev => ({ ...prev, assignmentName: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="assignmentDue">Hạn nộp</Label>
                          <Input
                            id="assignmentDue"
                            type="datetime-local"
                            value={newAssignment.assignmentDue}
                            onChange={(e) => setNewAssignment(prev => ({ ...prev, assignmentDue: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="assignmentWeight">Trọng số (%)</Label>
                          <Input
                            id="assignmentWeight"
                            type="number"
                            min="0"
                            max="100"
                            value={newAssignment.assignmentWeight}
                            onChange={(e) => setNewAssignment(prev => ({ ...prev, assignmentWeight: Number(e.target.value) }))}
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsCreateAssignmentOpen(false)}>
                          Hủy
                        </Button>
                        <Button type="submit" disabled={isCreatingAssignment}>
                          {isCreatingAssignment ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tạo'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
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
                                <Button size="sm" variant="outline" onClick={() => openEditAssignment(assignment)}>Chỉnh sửa</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteAssignment(assignment.id)}>Xóa</Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isTutor && (
                                <Button size="sm" variant="outline" onClick={() => openViewSubmissions(assignment)}>
                                  Xem bài nộp
                                </Button>
                              )}
                              <Button size="sm" className="gap-2" onClick={() => openSubmitDialog(assignment)}>
                                <Send className="h-4 w-4" />
                                Chỉnh sửa bài nộp
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Edit Submission Modal */}
          <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
            <DialogContent>
              <form onSubmit={handleEditSubmission}>
                <DialogHeader>
                  <DialogTitle>Chỉnh sửa bài nộp</DialogTitle>
                  <DialogDescription>
                    {selectedAssignment ? `Chỉnh sửa cho: ${selectedAssignment.assignmentName}` : 'Nhập nội dung cập nhật cho bài nộp của bạn'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="submissionContent">Nội dung</Label>
                    <Textarea
                      id="submissionContent"
                      placeholder="Cập nhật liên kết, văn bản, hoặc câu trả lời của bạn..."
                      value={submissionContent}
                      onChange={(e) => setSubmissionContent(e.target.value)}
                      rows={6}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsSubmitOpen(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="gap-2">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật bài nộp'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* View Submissions Modal */}
          <Dialog open={isViewSubsOpen} onOpenChange={setIsViewSubsOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bài nộp</DialogTitle>
                <DialogDescription>
                  {viewingAssignment ? `Danh sách bài nộp cho: ${viewingAssignment.assignmentName}` : ''}
                </DialogDescription>
              </DialogHeader>
              <div className="py-2">
                {isLoadingSubs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">Chưa có bài nộp nào</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Học viên</TableHead>
                        <TableHead>Thời gian</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Điểm</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>@{s.username}</TableCell>
                          <TableCell>{new Date(s.submissionTime).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={s.status === 'LATE' ? 'destructive' : 'secondary'}>{s.status}</Badge>
                          </TableCell>
                          <TableCell>{s.grade ?? 'Chưa chấm'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewSubsOpen(false)}>Đóng</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Edit Assignment Modal */}
          <Dialog open={isEditAssignmentOpen} onOpenChange={setIsEditAssignmentOpen}>
            <DialogContent>
              <form onSubmit={handleUpdateAssignment}>
                <DialogHeader>
                  <DialogTitle>Chỉnh sửa bài tập</DialogTitle>
                  <DialogDescription>Chỉnh sửa thông tin bài tập</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="editAssignmentName">Tên bài tập</Label>
                    <Input
                      id="editAssignmentName"
                      value={editingAssignment?.assignmentName || ''}
                      onChange={(e) => setEditingAssignment(prev => prev ? { ...prev, assignmentName: e.target.value } : prev)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editAssignmentDue">Hạn nộp</Label>
                    <Input
                      id="editAssignmentDue"
                      type="datetime-local"
                      value={editingAssignment?.assignmentDue || ''}
                      onChange={(e) => setEditingAssignment(prev => prev ? { ...prev, assignmentDue: e.target.value } : prev)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editAssignmentWeight">Trọng số (%)</Label>
                    <Input
                      id="editAssignmentWeight"
                      type="number"
                      min="0"
                      max="100"
                      value={editingAssignment?.assignmentWeight ?? 0}
                      onChange={(e) => setEditingAssignment(prev => prev ? { ...prev, assignmentWeight: Number(e.target.value) } : prev)}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditAssignmentOpen(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={isUpdatingAssignment}>
                    {isUpdatingAssignment ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lưu thay đổi'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Students Tab */}
          <TabsContent value="students">
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
                                onClick={() => handlePromoteTutor(enrollment.userId)}
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
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default CourseDetail;
