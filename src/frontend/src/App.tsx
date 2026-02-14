import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { AuthGate } from './components/auth/AuthGate';
import { ProfileSetupModal } from './components/auth/ProfileSetupModal';
import { LoginButton } from './components/auth/LoginButton';
import { DashboardPage } from './pages/DashboardPage';
import { SubscribersPage } from './pages/SubscribersPage';
import { BillingPage } from './pages/BillingPage';
import { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { Users, DollarSign, LayoutDashboard } from 'lucide-react';

type Page = 'dashboard' | 'subscribers' | 'billing';

export default function App() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (!isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthGate />
        <Toaster />
      </ThemeProvider>
    );
  }

  if (showProfileSetup) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ProfileSetupModal />
        <Toaster />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <span className="text-lg font-bold">T@N</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight">TAHA @NET</h1>
              </div>
              <LoginButton />
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="border-b border-border bg-card/50">
          <div className="container mx-auto px-4">
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  currentPage === 'dashboard'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </button>
              <button
                onClick={() => setCurrentPage('subscribers')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  currentPage === 'subscribers'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="h-4 w-4" />
                Subscribers
              </button>
              <button
                onClick={() => setCurrentPage('billing')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  currentPage === 'billing'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <DollarSign className="h-4 w-4" />
                Monthly Billing
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {currentPage === 'dashboard' && <DashboardPage />}
          {currentPage === 'subscribers' && <SubscribersPage />}
          {currentPage === 'billing' && <BillingPage />}
        </main>

        {/* Footer */}
        <footer className="mt-16 border-t border-border bg-card/50 py-6">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} TAHA @NET. Built with ❤️ using{' '}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                  window.location.hostname
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:underline"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </footer>
      </div>
      <Toaster />
    </ThemeProvider>
  );
}
