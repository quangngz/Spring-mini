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
import { coursesApi, enrollmentApi, CourseDTO } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, BookOpen, Users, Lock, Unlock, Loader2, Calendar } from 'lucide-react';

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
    name: '',
    isPrivate: false,
    endDate: '',
  });

  const fetchCourses = async () => {
    try {
      const data = await coursesApi.getAll();
      setCourses(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch courses',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchCourses();
      return;
    }
    setIsLoading(true);
    try {
      const data = await coursesApi.search(searchQuery);
      setCourses(data || []);
    } catch {
      toast({
        title: 'Search failed',
        description: 'Could not search courses',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async (courseCode: string) => {
    try {
      await enrollmentApi.enroll(courseCode);
      toast({
        title: 'Enrolled!',
        description: `You are now enrolled in ${courseCode}`,
      });
    } catch (error: any) {
      toast({
        title: 'Enrollment failed',
        description: error.response?.data?.message || 'Could not enroll in course',
        variant: 'destructive',
      });
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await coursesApi.create(newCourse);
      toast({
        title: 'Course created!',
        description: `${newCourse.name} has been created`,
      });
      setIsCreateOpen(false);
      setNewCourse({ courseCode: '', name: '', isPrivate: false, endDate: '' });
      fetchCourses();
    } catch (error: any) {
      toast({
        title: 'Creation failed',
        description: error.response?.data?.message || 'Could not create course',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.courseCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {user?.firstname}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Explore courses and continue your learning journey
            </p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Course
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateCourse}>
                <DialogHeader>
                  <DialogTitle>Create New Course</DialogTitle>
                  <DialogDescription>
                    Fill in the details to create a new course
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="courseCode">Course Code</Label>
                    <Input
                      id="courseCode"
                      placeholder="CS101"
                      value={newCourse.courseCode}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, courseCode: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Course Name</Label>
                    <Input
                      id="name"
                      placeholder="Introduction to Computer Science"
                      value={newCourse.name}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date (Optional)</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newCourse.endDate}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isPrivate">Private Course</Label>
                    <Switch
                      id="isPrivate"
                      checked={newCourse.isPrivate}
                      onCheckedChange={(checked) => setNewCourse(prev => ({ ...prev, isPrivate: checked }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Course'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-8 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button variant="secondary" onClick={handleSearch}>
            Search
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
              <h3 className="text-lg font-medium text-foreground mb-2">No courses found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try a different search term' : 'Create your first course to get started'}
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
                          Private
                        </>
                      ) : (
                        <>
                          <Unlock className="h-3 w-3" />
                          Public
                        </>
                      )}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4 group-hover:text-primary transition-colors">
                    {course.name}
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
                      Ends: {new Date(course.endDate).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="gap-2">
                  <Link to={`/courses/${course.courseCode}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Button onClick={() => handleEnroll(course.courseCode)}>
                    Enroll
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Dashboard;
