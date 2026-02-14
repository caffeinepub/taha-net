import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { sanitizePhone, isValidPhone, getPhoneValidationError } from '../lib/phone';
import { useClaimSubscriber } from '../hooks/useQueries';
import { toast } from 'sonner';
import { Smartphone, AlertCircle, Loader2 } from 'lucide-react';

interface SubscriberLoginPageProps {
  onSuccess: () => void;
  onBack?: () => void;
}

export function SubscriberLoginPage({ onSuccess, onBack }: SubscriberLoginPageProps) {
  const [phoneInput, setPhoneInput] = useState('');
  const [touched, setTouched] = useState(false);
  const claimSubscriber = useClaimSubscriber();

  const sanitized = sanitizePhone(phoneInput);
  const isValid = isValidPhone(phoneInput);
  const validationError = touched ? getPhoneValidationError(phoneInput) : null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits
    const digitsOnly = sanitizePhone(value);
    // Limit to 10 digits
    if (digitsOnly.length <= 10) {
      setPhoneInput(digitsOnly);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!isValid) {
      return;
    }

    try {
      await claimSubscriber.mutateAsync({
        phone: sanitized,
        name: sanitized, // Search by phone in name field
      });
      toast.success('تم ربط الحساب بنجاح!');
      onSuccess();
    } catch (error: any) {
      const errorMessage = error?.message || 'فشل ربط الحساب';
      toast.error(errorMessage);
      console.error('Claim error:', error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">تسجيل دخول المشترك</CardTitle>
          <CardDescription className="text-base">
            أدخل رقم هاتفك المسجل للوصول إلى حسابك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-base">
                رقم الهاتف
              </Label>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder="09xxxxxxxx"
                value={phoneInput}
                onChange={handlePhoneChange}
                onBlur={() => setTouched(true)}
                className={`text-lg ${validationError ? 'border-destructive' : ''}`}
                autoFocus
                dir="ltr"
              />
              <p className="text-sm text-muted-foreground">
                أدخل رقم هاتفك المكون من 10 أرقام والذي يبدأ بـ 09
              </p>
              {validationError && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              )}
            </div>

            {claimSubscriber.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {claimSubscriber.error?.message || 'حدث خطأ أثناء ربط الحساب'}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Button
                type="submit"
                className="w-full"
                disabled={!isValid || claimSubscriber.isPending}
                size="lg"
              >
                {claimSubscriber.isPending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  'تسجيل الدخول'
                )}
              </Button>
              {onBack && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={onBack}
                  disabled={claimSubscriber.isPending}
                >
                  رجوع
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
