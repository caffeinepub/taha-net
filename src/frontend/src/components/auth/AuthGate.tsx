import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { LogIn } from 'lucide-react';

export function AuthGate() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <span className="text-2xl font-bold">T@N</span>
          </div>
          <CardTitle className="text-2xl">TAHA @NET</CardTitle>
          <CardDescription>نظام إدارة مشتركي مركز الإنترنت</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            يرجى تسجيل الدخول للوصول إلى نظام إدارة المشتركين.
          </p>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            className="w-full"
            size="lg"
          >
            <LogIn className="ml-2 h-4 w-4" />
            {isLoggingIn ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
