import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGetAllPackages } from '../hooks/useQueries';
import { Calendar, AlertCircle } from 'lucide-react';

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

export function BillingPage() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  const { isLoading: packagesLoading } = useGetAllPackages();

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  if (packagesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">الفواتير الشهرية</h2>
        <p className="text-muted-foreground">إدارة حالة الفواتير لكل مشترك</p>
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

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          وظيفة الفواتير غير متاحة حاليًا. يتطلب ذلك تنفيذ وظائف إضافية في الخادم الخلفي.
        </AlertDescription>
      </Alert>

      {/* Billing Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            الفواتير لشهر {MONTHS.find((m) => m.value === selectedMonth)?.label} {selectedYear}
          </CardTitle>
          <CardDescription>
            تعيين حالة الاستحقاق والدفع لكل مشترك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            لا توجد بيانات فواتير متاحة. يتطلب ذلك تنفيذ وظائف الفواتير في الخادم الخلفي.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
