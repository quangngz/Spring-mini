import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { coursesApi, assignmentsApi, submissionsApi, Assignment, Submission, CourseDTO } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ClipboardList, Clock, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const Assignments = () => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [assignments, setAssignments] = useState<Record<string, Assignment[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<{ courseCode: string; assignment: Assignment } | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coursesData = await coursesApi.getAll();
        setCourses(coursesData || []);
        
        const assignmentsMap: Record<string, Assignment[]> = {};
        await Promise.all(
          (coursesData || []).map(async (course) => {
            try {
              const courseAssignments = await assignmentsApi.getAll(course.courseCode);
              assignmentsMap[course.courseCode] = courseAssignments || [];
            } catch {
              assignmentsMap[course.courseCode] = [];
            }
          })
        );
        setAssignments(assignmentsMap);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch assignments',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!selectedAssignment) return;
    
    setIsSubmitting(true);
    try {
      await submissionsApi.submit(
        selectedAssignment.courseCode,
        selectedAssignment.assignment.id,
        { content: submissionContent }
      );
      toast({
        title: 'Submitted!',
        description: 'Your submission has been received',
      });
      setSubmitDialogOpen(false);
      setSubmissionContent('');
      setSelectedAssignment(null);
    } catch (error: any) {
      toast({
        title: 'Submission failed',
        description: error.response?.data?.message || 'Could not submit assignment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDueStatus = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 0) return { status: 'overdue', label: 'Overdue', variant: 'destructive' as const };
    if (diffHours < 24) return { status: 'urgent', label: 'Due Soon', variant: 'default' as const };
    return { status: 'upcoming', label: 'Upcoming', variant: 'secondary' as const };
  };

  const allAssignments = Object.entries(assignments).flatMap(([courseCode, courseAssignments]) =>
    courseAssignments.map(assignment => ({
      ...assignment,
      courseCode,
      courseName: courses.find(c => c.courseCode === courseCode)?.name || courseCode,
    }))
  ).sort((a, b) => new Date(a.assignmentDue).getTime() - new Date(b.assignmentDue).getTime());

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Assignments</h1>
          <p className="text-muted-foreground mt-1">
            View and submit your assignments
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allAssignments.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {allAssignments.filter(a => getDueStatus(a.assignmentDue).status === 'urgent').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {allAssignments.filter(a => getDueStatus(a.assignmentDue).status === 'overdue').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignments List */}
        {allAssignments.length === 0 ? (
          <Card className="py-16">
            <CardContent className="text-center">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No assignments</h3>
              <p className="text-muted-foreground">
                You don't have any assignments yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {allAssignments.map((assignment, index) => {
              const dueStatus = getDueStatus(assignment.assignmentDue);
              
              return (
                <Card 
                  key={`${assignment.courseCode}-${assignment.id}`}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-3">
                          {assignment.assignmentName}
                          <Badge variant={dueStatus.variant}>
                            {dueStatus.label}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-2">
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded mr-2">
                            {assignment.courseCode}
                          </span>
                          {assignment.courseName}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{assignment.assignmentWeight}%</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Due: {new Date(assignment.assignmentDue).toLocaleString()}
                      </div>
                      <Dialog open={submitDialogOpen && selectedAssignment?.assignment.id === assignment.id} onOpenChange={(open) => {
                        setSubmitDialogOpen(open);
                        if (!open) setSelectedAssignment(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            className="gap-2"
                            onClick={() => setSelectedAssignment({ courseCode: assignment.courseCode, assignment })}
                          >
                            <Send className="h-4 w-4" />
                            Submit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Submit Assignment</DialogTitle>
                            <DialogDescription>
                              Submit your work for "{assignment.assignmentName}"
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="content">Submission Content</Label>
                              <Textarea
                                id="content"
                                placeholder="Enter your submission content here..."
                                value={submissionContent}
                                onChange={(e) => setSubmissionContent(e.target.value)}
                                rows={6}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => {
                                setSubmitDialogOpen(false);
                                setSelectedAssignment(null);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting || !submissionContent.trim()}>
                              {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Submit
                                </>
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Assignments;
