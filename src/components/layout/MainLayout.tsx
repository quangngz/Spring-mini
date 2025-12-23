import { ReactNode } from 'react';
import { Header } from './Header';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border py-6 bg-card">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2024 EduPortal. Built with Spring Boot & React.</p>
        </div>
      </footer>
    </div>
  );
};
