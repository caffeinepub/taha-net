import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useGetAllActiveSubscribers,
  useGetAllPackages,
  useGetBillingState,
  useSetMonthBillingStatus,
} from '../hooks/useQueries';
import { formatUSD } from '../lib/money';
import { toast } from 'sonner';
import { Calendar } from 'lucide-react';
import type { Subscriber, Package } from '../backend';

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

type BillingRow = {
  subscriber: Subscriber;
  package: Package | undefined;
  due: boolean;
  paid: boolean;
};

function SubscriberBillingRow({
  subscriber,
  pkg,
  selectedYear,
  selectedMonth,
  onToggleDue,
  onTogglePaid,
}: {
  subscriber: Subscriber;
  pkg: Package | undefined;
  selectedYear: number;
  selectedMonth: number;
  onToggleDue: (phone: string, currentDue: boolean, currentPaid: boolean) => void;
  onTogglePaid: (phone: string, currentDue: boolean, currentPaid: boolean) => void;
}) {
  const { data: billingState } = useGetBillingState(subscriber.phone);

  const yearBilling = billingState?.find((b) => Number(b.year) === selectedYear);
  const monthStatus = yearBilling?.months.find((m) => Number(m.month) === selectedMonth);

  const due = monthStatus?.due || false;
  const paid = monthStatus?.paid || false;

  return (
    <TableRow>
      <TableCell className="font-medium">{subscriber.fullName}</TableCell>
      <TableCell>{pkg?.name || 'غير معروف'}</TableCell>
      <TableCell>{pkg ? formatUSD(pkg.priceUsd) : '$0.00'}</TableCell>
      <TableCell>
        <Switch
          checked={due}
          onCheckedChange={() => onToggleDue(subscriber.phone, due, paid)}
        />
      </TableCell>
      <TableCell>
        <Switch
          checked={paid}
          disabled={!due}
          onCheckedChange={() => onTogglePaid(subscriber.phone, due, paid)}
        />
      </TableCell>
      <TableCell>
        {!due ? (
          <Badge variant="secondary">غير مستحق</Badge>
        ) : paid ? (
          <Badge variant="default">مدفوع</Badge>
        ) : (
          <Badge variant="destructive">غير مدفوع</Badge>
        )}
      </TableCell>
    </TableRow>
  );
}

export function BillingPage() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  const { data: subscribers = [], isLoading: subscribersLoading } = useGetAllActiveSubscribers();
  const { data: packages = [], isLoading: packagesLoading } = useGetAllPackages();
  const setMonthBillingStatus = useSetMonthBillingStatus();

  const handleToggleDue = async (phone: string, currentDue: boolean, currentPaid: boolean) => {
    try {
      await setMonthBillingStatus.mutateAsync({
        phone,
        year: BigInt(selectedYear),
        month: BigInt(selectedMonth),
        due: !currentDue,
        paid: currentPaid && !currentDue ? false : currentPaid,
      });
      toast.success(currentDue ? 'تم إلغاء الاستحقاق' : 'تم تعيين الاستحقاق');
    } catch (error) {
      toast.error('فشلت العملية. يرجى المحاولة مرة أخرى.');
      console.error('Toggle due error:', error);
    }
  };

  const handleTogglePaid = async (phone: string, currentDue: boolean, currentPaid: boolean) => {
    if (!currentDue) {
      toast.error('يجب تعيين الاستحقاق أولاً');
      return;
    }

    try {
      await setMonthBillingStatus.mutateAsync({
        phone,
        year: BigInt(selectedYear),
        month: BigInt(selectedMonth),
        due: currentDue,
        paid: !currentPaid,
      });
      toast.success(currentPaid ? 'تم إلغاء الدفع' : 'تم تعيين الدفع');
    } catch (error) {
      toast.error('فشلت العملية. يرجى المحاولة مرة أخرى.');
      console.error('Toggle paid error:', error);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  if (subscribersLoading || packagesLoading) {
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
          {subscribers.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              لا يوجد مشتركون نشطون
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الباقة</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>مستحق</TableHead>
                  <TableHead>مدفوع</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((subscriber) => {
                  const pkg = packages.find((p) => p.id === subscriber.packageId);
                  return (
                    <SubscriberBillingRow
                      key={subscriber.id.toString()}
                      subscriber={subscriber}
                      pkg={pkg}
                      selectedYear={selectedYear}
                      selectedMonth={selectedMonth}
                      onToggleDue={handleToggleDue}
                      onTogglePaid={handleTogglePaid}
                    />
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
