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
import { coursesApi, assignmentsApi, enrollmentApi, CourseDTO, Assignment, UserCourse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, BookOpen, Users, Calendar, Lock, Unlock, Plus, Loader2, Trash2, GraduationCap, UserCheck } from 'lucide-react';

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
  const [editCourse, setEditCourse] = useState<{ courseName: string; isPrivate: boolean; endDate?: string } | null>(null);

  useEffect(() => {
    if (!courseCode) {
      toast({
        title: 'Invalid course URL',
        description: 'No course code provided in URL',
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
        // Debug: track fetched payloads (assignments only)
        console.log('Debug: assignmentsData (fetched)', assignmentsData);
        setCourse(courseData);
        setAssignments(assignmentsData || []);
        setEnrollments(enrollmentsData || []);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch course details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [courseCode]);

  // Log assignments whenever they change
  useEffect(() => {
    console.log('Debug: assignments state updated', assignments);
  }, [assignments]);

  const isCreator = user?.username === course?.createdBy;

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode) return;
    
    setIsCreatingAssignment(true);
    try {
      const created = await assignmentsApi.create(courseCode, newAssignment);
      console.log('Debug: assignment created', created);
      // Re-fetch assignments to verify persistence in DB
      const freshAssignments = await assignmentsApi.getAll(courseCode);
      setAssignments(freshAssignments || []);
      toast({
        title: 'Assignment created!',
        description: `${newAssignment.assignmentName} has been added`,
      });
      setIsCreateAssignmentOpen(false);
      setNewAssignment({ assignmentName: '', assignmentDue: '', assignmentWeight: 10 });
    } catch (error: any) {
      toast({
        title: 'Creation failed',
        description: error.response?.data?.message || 'Could not create assignment',
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
      toast({ title: 'Assignment updated', description: updated.assignmentName });
      const fresh = await assignmentsApi.getAll(courseCode);
      setAssignments(fresh || []);
      setIsEditAssignmentOpen(false);
      setEditingAssignment(null);
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.response?.data?.message || 'Could not update assignment',
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
      toast({ title: 'Assignment deleted' });
      const fresh = await assignmentsApi.getAll(courseCode);
      setAssignments(fresh || []);
    } catch (error: any) {
      toast({
        title: 'Deletion failed',
        description: error.response?.data?.message || 'Could not delete assignment',
        variant: 'destructive',
      });
    }
  };

  const openEditCourse = () => {
    if (!course) return;
    setEditCourse({ courseName: course.courseName, isPrivate: course.isPrivate, endDate: course.endDate || '' });
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
      });
      toast({ title: 'Course updated', description: updated.courseName });
      setCourse(updated);
      setIsEditCourseOpen(false);
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.response?.data?.message || 'Could not update course',
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
      toast({ title: 'User promoted to tutor' });
      const updated = await coursesApi.getEnrollments(courseCode);
      setEnrollments(updated || []);
    } catch (error: any) {
      toast({
        title: 'Promotion failed',
        description: error.response?.data?.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseCode) return;
    try {
      await coursesApi.delete(courseCode);
      toast({ title: 'Course deleted' });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Deletion failed',
        description: error.response?.data?.message,
        variant: 'destructive',
      });
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
          <h1 className="text-2xl font-bold">Course not found</h1>
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
          Back to Courses
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
                  {course.isPrivate ? 'Private' : 'Public'}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{course.courseCode}</span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {enrollments.length} enrolled
                </span>
                {course.endDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Ends {new Date(course.endDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {isCreator && (
            <Button variant="destructive" onClick={handleDeleteCourse} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete Course
            </Button>
          )}
          {isCreator && (
            <Dialog open={isEditCourseOpen} onOpenChange={setIsEditCourseOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="gap-2 ml-2" onClick={openEditCourse}>
                  Edit Course
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleUpdateCourse}>
                  <DialogHeader>
                    <DialogTitle>Edit Course</DialogTitle>
                    <DialogDescription>Update course details</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="editCourseName">Course Name</Label>
                      <Input
                        id="editCourseName"
                        value={editCourse?.courseName || ''}
                        onChange={(e) => setEditCourse(prev => prev ? { ...prev, courseName: e.target.value } : prev)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editCourseEndDate">End Date (Optional)</Label>
                      <Input
                        id="editCourseEndDate"
                        type="date"
                        value={editCourse?.endDate || ''}
                        onChange={(e) => setEditCourse(prev => prev ? { ...prev, endDate: e.target.value } : prev)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="isPrivate">Private Course</Label>
                      <Switch
                        id="isPrivate"
                        checked={editCourse?.isPrivate || false}
                        onCheckedChange={(checked) => setEditCourse(prev => prev ? { ...prev, isPrivate: checked } : prev)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsEditCourseOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isUpdatingCourse}>
                      {isUpdatingCourse ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="assignments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="assignments" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-2">
              <Users className="h-4 w-4" />
              Students
            </TabsTrigger>
          </TabsList>

          {/* Assignments Tab */}
          <TabsContent value="assignments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Assignments</CardTitle>
                  <CardDescription>Manage course assignments and due dates</CardDescription>
                </div>
                <Dialog open={isCreateAssignmentOpen} onOpenChange={setIsCreateAssignmentOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Assignment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleCreateAssignment}>
                      <DialogHeader>
                        <DialogTitle>Create Assignment</DialogTitle>
                        <DialogDescription>Add a new assignment to this course</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="assignmentName">Assignment Name</Label>
                          <Input
                            id="assignmentName"
                            value={newAssignment.assignmentName}
                            onChange={(e) => setNewAssignment(prev => ({ ...prev, assignmentName: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="assignmentDue">Due Date</Label>
                          <Input
                            id="assignmentDue"
                            type="datetime-local"
                            value={newAssignment.assignmentDue}
                            onChange={(e) => setNewAssignment(prev => ({ ...prev, assignmentDue: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="assignmentWeight">Weight (%)</Label>
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
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isCreatingAssignment}>
                          {isCreatingAssignment ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
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
                    <p>No assignments yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Assignment</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Weight</TableHead>
                        <TableHead>Created By</TableHead>
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
                                <Button size="sm" variant="outline" onClick={() => openEditAssignment(assignment)}>Edit</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteAssignment(assignment.id)}>Delete</Button>
                              </div>
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
          {/* Edit Assignment Modal */}
          <Dialog open={isEditAssignmentOpen} onOpenChange={setIsEditAssignmentOpen}>
            <DialogContent>
              <form onSubmit={handleUpdateAssignment}>
                <DialogHeader>
                  <DialogTitle>Edit Assignment</DialogTitle>
                  <DialogDescription>Modify the assignment details</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="editAssignmentName">Assignment Name</Label>
                    <Input
                      id="editAssignmentName"
                      value={editingAssignment?.assignmentName || ''}
                      onChange={(e) => setEditingAssignment(prev => prev ? { ...prev, assignmentName: e.target.value } : prev)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editAssignmentDue">Due Date</Label>
                    <Input
                      id="editAssignmentDue"
                      type="datetime-local"
                      value={editingAssignment?.assignmentDue || ''}
                      onChange={(e) => setEditingAssignment(prev => prev ? { ...prev, assignmentDue: e.target.value } : prev)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editAssignmentWeight">Weight (%)</Label>
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
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUpdatingAssignment}>
                    {isUpdatingAssignment ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Enrolled Students</CardTitle>
                <CardDescription>View and manage course enrollments</CardDescription>
              </CardHeader>
              <CardContent>
                {enrollments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No students enrolled yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
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
                                Promote to Tutor
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
