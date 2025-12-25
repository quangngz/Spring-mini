import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { GraduationCap, BookOpen, Users, ClipboardList, LogOut, User } from 'lucide-react';

export const Header = () => {
  const { user, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  const getInitials = (firstname?: string, lastname?: string) => {
    return `${firstname?.[0] || ''}${lastname?.[0] || ''}`.toUpperCase() || 'U';
  };

  const isAdmin = user?.roles?.includes('ADMIN');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">EduPortal</span>
        </Link>

        {isAuthenticated ? (
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Khóa học
                </Button>
              </Link>
              {isAdmin && (
                <Link to="/users">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Users className="h-4 w-4" />
                    Người dùng
                  </Button>
                </Link>
              )}
              <Link to="/assignments">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Bài tập
                </Button>
              </Link>
            </nav>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                      {getInitials(user?.firstname, user?.lastname)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.firstname} {user?.lastname}</p>
                    <p className="text-xs text-muted-foreground">@{user?.username}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Hồ sơ
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/signin">
              <Button variant="ghost" size="sm">Đăng nhập</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Bắt đầu</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
