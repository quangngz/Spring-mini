import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { coursesApi, enrollmentApi, CourseDTO } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, BookOpen, Users, Lock, Unlock, Loader2, Calendar, Edit } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCourse, setNewCourse] = useState({
    courseCode: '',
    courseName: '',
    isPrivate: false,
    endDate: '',
    password: '',
    confirmPassword: '',
  });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUpdatingCourse, setIsUpdatingCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<{ courseCode: string; courseName: string; isPrivate: boolean; 
    endDate?: string; oldPassword?: string; password?: string; confirmPassword?: string } | null>(null);
  const [enrolledCourseCodes, setEnrolledCourseCodes] = useState<Set<string>>(new Set());
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawCourse, setWithdrawCourse] = useState<{ code: string; name: string } | null>(null);
  const [privacyFilter, setPrivacyFilter] = useState<'all' | 'private' | 'public'>('all');

  const fetchCourses = async () => {
    try {
      const data = await coursesApi.getAll();
      setCourses(Array.isArray(data) ? data : []);
      // Refresh enrolled course codes for current user
      await refreshEnrollments(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể lấy danh sách khóa học',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Build a set of course codes the current user is enrolled in
  const refreshEnrollments = async (coursesList: CourseDTO[]) => {
    if (!user?.username) return;
    try {
      const results = await Promise.all((coursesList || []).map(async (course) => {
        const code = course?.courseCode || '';
        if (!code) return { code, enrolled: false };
        // Treat course creator as enrolled
        const creatorEnrolled = user.username === course.createdBy;
        try {
          const enrollments = await coursesApi.getEnrollments(code);
          const userEnrolled = Array.isArray(enrollments) && enrollments.some((e) => e?.username === user.username);
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
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    setIsLoading(true);
    try {
      // Map tri-state privacy filter to API param: null (all), true (private), false (public)
      const isPrivateParam = privacyFilter === 'all' ? null : privacyFilter === 'private';
      const data = await coursesApi.search(q || undefined, isPrivateParam);
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
  };

  // Auto-run search when privacy filter changes
  useEffect(() => {
    if (isLoading) return;
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privacyFilter]);

  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [enrollCourse, setEnrollCourse] = useState<{ code: string; name: string; isPrivate: boolean } | null>(null);
  const [enrollPassword, setEnrollPassword] = useState('');

  const handleEnroll = async (courseCode: string, password?: string) => {
    try {
      await enrollmentApi.enroll(courseCode, password);
      toast({
        title: 'Đã ghi danh!',
        description: `Bạn đã ghi danh vào ${courseCode}`,
      });
      // Mark as enrolled locally to hide the button immediately
      setEnrolledCourseCodes((prev) => {
        const next = new Set(prev);
        if (courseCode) next.add(courseCode);
        return next;
      });
      if (isEnrollOpen) {
        setIsEnrollOpen(false);
        setEnrollCourse(null);
        setEnrollPassword('');
      }
    } catch (error: any) {
      toast({
        title: 'Ghi danh thất bại',
        description: error.response?.data?.message || 'Không thể ghi danh khóa học',
        variant: 'destructive',
      });
    }
  };

  const handleWithdraw = async (courseCode: string, courseName: string) => {
    if (!courseCode) return;
    try {
      await enrollmentApi.withdraw(courseCode);
      toast({
        title: 'Đã rời khóa học',
        description: `Bạn đã rời khỏi ${courseName}`,
      });
      setEnrolledCourseCodes((prev) => {
        const next = new Set(prev);
        next.delete(courseCode);
        return next;
      });
      setIsWithdrawOpen(false);
      setWithdrawCourse(null);
    } catch (error: any) {
      toast({
        title: 'Rời khóa học thất bại',
        description: error.response?.data?.message || 'Không thể rời khóa học',
        variant: 'destructive',
      });
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate password for private courses
    if (newCourse.isPrivate) {
      if (!newCourse.password || !newCourse.confirmPassword) {
        toast({ title: 'Thiếu mật khẩu', description: 'Vui lòng nhập mật khẩu và xác nhận mật khẩu', variant: 'destructive' });
        return;
      }
      if (newCourse.password !== newCourse.confirmPassword) {
        toast({ title: 'Mật khẩu không khớp', description: 'Vui lòng nhập lại để đảm bảo khớp', variant: 'destructive' });
        return;
      }
    }
    setIsCreating(true);
    try {
      const payload = {
        courseCode: newCourse.courseCode,
        courseName: newCourse.courseName,
        isPrivate: newCourse.isPrivate,
        endDate: newCourse.endDate || undefined,
        password: newCourse.isPrivate ? newCourse.password : undefined,
      };
      await coursesApi.create(payload as any);
      toast({
        title: 'Tạo khóa học thành công!',
        description: `${newCourse.courseName} đã được tạo`,
      });
      setIsCreateOpen(false);
      setNewCourse({ courseCode: '', courseName: '', isPrivate: false, endDate: '', password: '', confirmPassword: '' });
      fetchCourses();
    } catch (error: any) {
      toast({
        title: 'Tạo thất bại',
        description: error.response?.data?.message || 'Không thể tạo khóa học',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const openEditCourse = (course: CourseDTO) => {
    setEditingCourse({
      courseCode: course.courseCode,
      courseName: course.courseName,
      isPrivate: course.isPrivate,
      endDate: course.endDate || ''
    });
    setIsEditOpen(true);
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    setIsUpdatingCourse(true);
    try {
      const updated = await coursesApi.update(editingCourse.courseCode, {
        courseName: editingCourse.courseName,
        isPrivate: editingCourse.isPrivate,
        endDate: editingCourse.endDate || undefined,
      }, editingCourse.oldPassword, editingCourse.password, editingCourse.confirmPassword);

      toast({ title: 'Cập nhật khóa học', description: updated.courseName });
      // Loop qua list courses và cập nhật nếu cùng courseCode 
      setCourses((prev) => prev.map((c) => (c.courseCode === updated.courseCode ? updated : c)));
      setIsEditOpen(false);
      setEditingCourse(null);
      fetchCourses();
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

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredCourses = (Array.isArray(courses) ? courses : []).filter((course) => {
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

  return (
    <MainLayout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Chào mừng trở lại, {user?.firstname}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Khám phá các khóa học và tiếp tục hành trình học tập của bạn
            </p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Tạo khóa học
              </Button>
            </DialogTrigger>
            <DialogContent>
              {/* Tạo khóa học */}
              <form onSubmit={handleCreateCourse}>
                <DialogHeader>
                  <DialogTitle>Tạo khóa học mới</DialogTitle>
                  <DialogDescription>
                    Nhập thông tin để tạo khóa học mới
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="courseCode">Mã khóa học</Label>
                    <Input
                      id="courseCode"
                      placeholder="CS101"
                      value={newCourse.courseCode}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, courseCode: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="courseName">Tên khóa học</Label>
                    <Input
                      id="courseName"
                      placeholder="Nhập môn Khoa học máy tính"
                      value={newCourse.courseName}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, courseName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Ngày kết thúc (Tùy chọn)</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newCourse.endDate}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isPrivate">Khóa học riêng tư</Label>
                    <Switch
                      id="isPrivate"
                      checked={newCourse.isPrivate}
                      onCheckedChange={(checked) => setNewCourse(prev => ({ ...prev, isPrivate: checked }))}
                    />
                  </div>
                  {newCourse.isPrivate && (
                    <div className="space-y-2">
                      <Label htmlFor="coursePassword">Mật khẩu khóa học</Label>
                      <Input
                        id="coursePassword"
                        type="password"
                        placeholder="Nhập mật khẩu"
                        value={newCourse.password}
                        onChange={(e) => setNewCourse(prev => ({ ...prev, password: e.target.value }))}
                        required={newCourse.isPrivate}
                      />
                      <Label htmlFor="coursePasswordConfirm">Xác nhận mật khẩu</Label>
                      <Input
                        id="coursePasswordConfirm"
                        type="password"
                        placeholder="Nhập lại mật khẩu"
                        value={newCourse.confirmPassword}
                        onChange={(e) => setNewCourse(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required={newCourse.isPrivate}
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      'Tạo khóa học'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-8 max-w-md items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm khóa học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <div className="min-w-[180px]">
            <Label className="sr-only" htmlFor="privacyFilter">Bộ lọc quyền riêng tư</Label>
            <Select value={privacyFilter} onValueChange={(val) => setPrivacyFilter(val as 'all' | 'private' | 'public')}>
              <SelectTrigger id="privacyFilter" aria-label="Bộ lọc quyền riêng tư">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="private">Riêng tư</SelectItem>
                <SelectItem value="public">Công khai</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="secondary" onClick={handleSearch}>
            Tìm kiếm
          </Button>
        </div>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCourses.length === 0 ? (
          <Card className="py-16">
            <CardContent className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Không tìm thấy khóa học</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Hãy thử từ khóa khác' : 'Tạo khóa học đầu tiên để bắt đầu'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course, index) => (
              <Card 
                key={course.id} 
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
                  {course.courseCode ? (
                    <Link to={`/courses/${course.courseCode}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        Xem chi tiết
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" className="flex-1" disabled>
                      Không có mã
                    </Button>
                  )}
                  {/* Enroll or Withdraw button depending on enrollment state (creator cannot withdraw). Private courses require password. */}
                  {(() => {
                    const isCreator = user?.username === course.createdBy;
                    const isEnrolled = enrolledCourseCodes.has(course.courseCode);
                    if (!course.courseCode) return null;
                    if (isCreator) return null;
                    return isEnrolled ? (
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setWithdrawCourse({ code: course.courseCode, name: course.courseName });
                          setIsWithdrawOpen(true);
                        }}
                      >
                        Rời khóa học
                      </Button>
                    ) : (
                      course.isPrivate ? (
                        <Button onClick={() => { setEnrollCourse({ code: course.courseCode, name: course.courseName, isPrivate: true }); setIsEnrollOpen(true); }}>
                          Ghi danh
                        </Button>
                      ) : (
                        <Button onClick={() => handleEnroll(course.courseCode)}>
                          Ghi danh
                        </Button>
                      )
                    );
                  })()}
                  {user?.username === course.createdBy && (
                    <Button variant="secondary" onClick={() => openEditCourse(course)}>
                      Chỉnh sửa
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        {/* Global Edit Course Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
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
                    value={editingCourse?.courseName || ''}
                    onChange={(e) => setEditingCourse(prev => prev ? { ...prev, courseName: e.target.value } : prev)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEndDate">Ngày kết thúc (Tùy chọn)</Label>
                  <Input
                    id="editEndDate"
                    type="date"
                    value={editingCourse?.endDate || ''}
                    onChange={(e) => setEditingCourse(prev => prev ? { ...prev, endDate: e.target.value } : prev)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="editIsPrivate">Khóa học riêng tư</Label>
                  <Switch
                    id="editIsPrivate"
                    checked={editingCourse?.isPrivate || false}
                    onCheckedChange={(checked) => setEditingCourse(prev => prev ? { ...prev, isPrivate: checked } : prev)}
                  />
                </div>
                  {editingCourse?.isPrivate && (
                    <div className="space-y-2">
                      <Label htmlFor="courseOldPassword">Mật khẩu cũ</Label>
                      <Input
                        id="courseOldPassword"
                        type="password"
                        placeholder="Nhập mật khẩu cũ"
                        value={editingCourse?.oldPassword || ''}
                        onChange={(e) => setEditingCourse(prev => prev ? { ...prev, oldPassword: e.target.value } : prev)}
                        required={editingCourse?.isPrivate}
                      />
                      <Label htmlFor="coursePassword">Mật khẩu khóa học</Label>
                      <Input
                        id="coursePassword"
                        type="password"
                        placeholder="Nhập mật khẩu mới"
                        value={editingCourse?.password || ''}
                        onChange={(e) => setEditingCourse(prev => prev ? { ...prev, password: e.target.value } : prev)}
                        required={editingCourse?.isPrivate}
                      />
                      <Label htmlFor="coursePasswordConfirm">Xác nhận mật khẩu</Label>
                      <Input
                        id="coursePasswordConfirm"
                        type="password"
                        placeholder="Nhập lại mật khẩu mới"
                        value={editingCourse?.confirmPassword || ''}
                        onChange={(e) => setEditingCourse(prev => prev ? { ...prev, confirmPassword: e.target.value } : prev)}
                        required={editingCourse?.isPrivate}
                      />
                    </div>
                  )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={isUpdatingCourse}>
                  {isUpdatingCourse ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...</>) : ('Lưu thay đổi')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {/* Withdraw Confirmation Modal */}
      <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận rời khóa học</DialogTitle>
            <DialogDescription>
              {withdrawCourse ? (
                <>Bạn có muốn rời khỏi khóa học "{withdrawCourse.name}"?</>
              ) : (
                'Bạn có muốn rời khỏi khóa học này?'
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWithdrawOpen(false)}>Không</Button>
            <Button
              variant="destructive"
              onClick={() => withdrawCourse && handleWithdraw(withdrawCourse.code, withdrawCourse.name)}
            >
              Có
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enroll Password Modal for Private Courses */}
      <Dialog open={isEnrollOpen} onOpenChange={setIsEnrollOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nhập mật khẩu khóa học</DialogTitle>
            <DialogDescription>
              {enrollCourse ? (
                <>Vui lòng nhập mật khẩu để ghi danh vào "{enrollCourse.name}"</>
              ) : (
                'Vui lòng nhập mật khẩu khóa học'
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="enrollPassword">Mật khẩu</Label>
            <Input
              id="enrollPassword"
              type="password"
              placeholder="Nhập mật khẩu"
              value={enrollPassword}
              onChange={(e) => setEnrollPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEnrollOpen(false)}>Hủy</Button>
            <Button onClick={() => enrollCourse && handleEnroll(enrollCourse.code, enrollPassword)} disabled={!enrollPassword}>
              Ghi danh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Dashboard;
