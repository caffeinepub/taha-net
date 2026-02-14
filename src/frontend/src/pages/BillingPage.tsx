import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useGetAllActiveSubscribers, useGetAllPackages, useGetBillingState, useSetMonthBillingStatus } from '../hooks/useQueries';
import { formatUSD } from '../lib/money';
import { toast } from 'sonner';
import { Calendar } from 'lucide-react';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export function BillingPage() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  const { data: subscribers = [], isLoading: subscribersLoading } = useGetAllActiveSubscribers();
  const { data: packages = [], isLoading: packagesLoading } = useGetAllPackages();
  const setMonthBillingStatus = useSetMonthBillingStatus();

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  const getPackagePrice = (packageId: bigint): bigint => {
    const pkg = packages.find((p) => p.id === packageId);
    return pkg ? pkg.priceUsd : BigInt(0);
  };

  const getPackageName = (packageId: bigint): string => {
    const pkg = packages.find((p) => p.id === packageId);
    return pkg ? pkg.name : 'Unknown';
  };

  const handleTogglePaid = async (phone: string, currentPaid: boolean, currentDue: boolean) => {
    try {
      await setMonthBillingStatus.mutateAsync({
        phone,
        year: BigInt(selectedYear),
        month: BigInt(selectedMonth),
        due: currentDue,
        paid: !currentPaid,
      });
      toast.success(currentPaid ? 'Marked as unpaid' : 'Marked as paid');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update billing status');
      console.error('Toggle paid error:', error);
    }
  };

  const handleToggleDue = async (phone: string, currentDue: boolean, currentPaid: boolean) => {
    try {
      await setMonthBillingStatus.mutateAsync({
        phone,
        year: BigInt(selectedYear),
        month: BigInt(selectedMonth),
        due: !currentDue,
        paid: currentPaid,
      });
      toast.success(currentDue ? 'Marked as not due' : 'Marked as due');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update billing status');
      console.error('Toggle due error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Monthly Billing</h2>
        <p className="text-muted-foreground">Track and manage monthly payments</p>
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

      <Card>
        <CardHeader>
          <CardTitle>
            Billing for {MONTHS.find((m) => m.value === selectedMonth)?.label} {selectedYear}
          </CardTitle>
          <CardDescription>Manage payment status for all active subscribers</CardDescription>
        </CardHeader>
        <CardContent>
          {subscribersLoading || packagesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : subscribers.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No active subscribers found.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subscriber</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Amount Due</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.map((subscriber) => {
                    const BillingStateComponent = () => {
                      const { data: billingState = [] } = useGetBillingState(subscriber.phone);
                      const yearData = billingState.find((y) => Number(y.year) === selectedYear);
                      const monthData = yearData?.months.find((m) => Number(m.month) === selectedMonth);
                      const isDue = monthData?.due ?? false;
                      const isPaid = monthData?.paid ?? false;

                      return (
                        <>
                          <TableCell className="font-medium">{subscriber.fullName}</TableCell>
                          <TableCell>{getPackageName(subscriber.packageId)}</TableCell>
                          <TableCell className="font-semibold">
                            {formatUSD(getPackagePrice(subscriber.packageId))}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={isDue}
                              onCheckedChange={() => handleToggleDue(subscriber.phone, isDue, isPaid)}
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={isPaid}
                              onCheckedChange={() => handleTogglePaid(subscriber.phone, isPaid, isDue)}
                              disabled={!isDue}
                            />
                          </TableCell>
                          <TableCell>
                            {!isDue ? (
                              <Badge variant="secondary">Not Due</Badge>
                            ) : isPaid ? (
                              <Badge variant="default">Paid</Badge>
                            ) : (
                              <Badge variant="destructive">Unpaid</Badge>
                            )}
                          </TableCell>
                        </>
                      );
                    };

                    return (
                      <TableRow key={subscriber.id.toString()}>
                        <BillingStateComponent />
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
