import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetCallerMonthlyDue } from '../hooks/useQueries';
import { formatUSD } from '../lib/money';
import { Calendar, AlertCircle, Receipt, CheckCircle2, DollarSign } from 'lucide-react';

const MONTHS = [
  { value: 1, label: 'يناير' },
  { value: 2, label: 'فبراير' },
  { value: 3, label: 'مارس' },
  { value: 4, label: 'أبريل' },
  { value: 5, label: 'مايو' },
  { value: 6, label: 'يونيو' },
  { value: 7, label: 'يوليو' },
  { value: 8, label: 'أغسطس' },
  { value: 9, label: 'سبتمبر' },
  { value: 10, label: 'أكتوبر' },
  { value: 11, label: 'نوفمبر' },
  { value: 12, label: 'ديسمبر' },
];

export function MyDuesPage() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  const { data: dueData, isLoading, isError, error } = useGetCallerMonthlyDue(selectedYear, selectedMonth);

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  const isNotLinkedError = error instanceof Error && 
    (error.message.includes('does not have a user profile') ||
     error.message.includes('does not have an active subscription') ||
     error.message.includes('not booked'));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">مستحقات الدفع</h2>
        <p className="text-muted-foreground">عرض المبالغ المستحقة عليك شهريًا</p>
      </div>

      {/* Date Selectors */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error Alert - Not Linked */}
      {isError && isNotLinkedError && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your account is not linked to an active subscription. Please contact the administrator to set up your subscription.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert - Other Errors */}
      {isError && !isNotLinkedError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load payment dues. {error instanceof Error ? error.message : 'Please try again later.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Due Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            المبلغ المستحق لشهر {MONTHS.find((m) => m.value === selectedMonth)?.label} {selectedYear}
          </CardTitle>
          <CardDescription>
            تفاصيل الدفع الشهري لاشتراكك
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : dueData ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">المبلغ المستحق</p>
                    <p className="text-3xl font-bold text-foreground">
                      {formatUSD(dueData.amountCents)}
                    </p>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <DollarSign className="h-8 w-8 text-primary" />
                  </div>
                </div>
              </div>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  This is the amount due for your subscription for the selected month. Please contact the administrator for payment details.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No payment information available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>حول مستحقات الدفع</CardTitle>
          <CardDescription>معلومات مهمة عن اشتراكك</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>المبلغ المستحق:</strong> يعرض المبلغ الذي يجب دفعه لاشتراكك في الشهر المحدد.
          </p>
          <p>
            <strong>الدفع:</strong> للحصول على تفاصيل الدفع أو إذا كان لديك أي أسئلة، يرجى الاتصال بالمسؤول.
          </p>
          <p className="pt-2 text-amber-600">
            <strong>ملاحظة:</strong> إذا لم يكن حسابك مرتبطًا باشتراك، يرجى الاتصال بالمسؤول لإعداد اشتراكك.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
