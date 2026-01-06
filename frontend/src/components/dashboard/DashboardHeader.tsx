import { useAuth } from '@/contexts/AuthContext';

const DashboardHeader = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground">
        Chào mừng trở lại, {user?.firstname}!
      </h1>
      <p className="text-muted-foreground mt-1">
        Khám phá các khóa học và tiếp tục hành trình học tập của bạn
      </p>
    </div>
  );
};

export default DashboardHeader;
