import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, BookOpen, Users, ClipboardList, ArrowRight, CheckCircle } from 'lucide-react';

const Index = () => {
  const features = [
    {
      icon: BookOpen,
      title: 'Quản lý khóa học',
      description: 'Tạo và quản lý khóa học dễ dàng. Thiết lập quyền riêng tư và quản lý việc ghi danh.',
    },
    {
      icon: Users,
      title: 'Quản trị người dùng',
      description: 'Quản lý người dùng đầy đủ với vai trò và quyền hạn. Quản trị viên kiểm soát mọi thứ.',
    },
    {
      icon: ClipboardList,
      title: 'Bài tập & chấm điểm',
      description: 'Tạo bài tập, theo dõi bài nộp và chấm điểm hiệu quả.',
    },
  ];

  const highlights = [
    'Xác thực dựa trên JWT',
    'Kiểm soát truy cập theo vai trò',
    'Hệ thống ghi danh khóa học',
    'Nộp bài tập',
    'Hệ thống thăng hạng trợ giảng',
    'Quản lý điểm số',
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">EduPortal</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/signin">
              <Button variant="ghost" size="sm">Đăng nhập</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Bắt đầu</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-[0.03]" />
        <div className="container py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center animate-slide-up">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Học tập hiện đại
              <span className="block text-primary mt-2">Hệ thống quản lý</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Nền tảng giáo dục hoàn chỉnh xây dựng bằng Spring Boot và React. 
              Quản lý khóa học, bài tập và người dùng với giao diện đẹp và trực quan.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="gap-2 h-12 px-8">
                  Bắt đầu
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/signin">
                <Button variant="outline" size="lg" className="h-12 px-8">
                  Đăng nhập
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground">
              Mọi thứ bạn cần để quản lý giáo dục
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Xây dựng với công nghệ hiện đại và thực hành tốt nhất để mang lại trải nghiệm mượt mà.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <Card 
                key={feature.title}
                className="group hover:shadow-card-hover transition-all duration-300 animate-slide-up border-border/50"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground">
                Vận hành bởi Spring Boot
              </h2>
              <p className="mt-4 text-muted-foreground">
                Giao diện này kết nối với backend Spring Boot mạnh mẽ với xác thực JWT, 
                kiểm soát truy cập theo vai trò và các endpoint RESTful.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {highlights.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-accent" />
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 p-8 flex items-center justify-center">
                <div className="w-full max-w-sm bg-card rounded-xl shadow-lg p-6 border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="h-4 w-24 bg-muted rounded" />
                      <div className="h-3 w-16 bg-muted/50 rounded mt-1" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 w-full bg-muted rounded" />
                    <div className="h-3 w-4/5 bg-muted rounded" />
                    <div className="h-3 w-3/5 bg-muted rounded" />
                  </div>
                  <div className="flex gap-2 mt-6">
                    <div className="h-8 flex-1 bg-primary/20 rounded" />
                    <div className="h-8 flex-1 bg-accent/20 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-primary-foreground">
            Sẵn sàng bắt đầu chưa?
          </h2>
          <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto">
            Tạo tài khoản ngay và bắt đầu quản lý nội dung học tập của bạn hôm nay.
          </p>
          <div className="mt-8">
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="gap-2 h-12 px-8">
                Tạo tài khoản
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">EduPortal</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 EduPortal. Xây dựng với Spring Boot & React.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
