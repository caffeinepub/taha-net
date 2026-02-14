import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  useGetAllPackages, 
  useBulkCreateSubscribers,
  useIsCallerAdmin,
  useDeleteAllSubscribers
} from '../hooks/useQueries';
import { formatUSD } from '../lib/money';
import { toast } from 'sonner';
import { Upload, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import type { BulkImportResult } from '../backend';

type BulkImportFormData = {
  names: string;
  packageId: string;
  subscriptionStartDate: string;
};

export function SubscribersPage() {
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [bulkImportData, setBulkImportData] = useState<BulkImportFormData>({
    names: '',
    packageId: '',
    subscriptionStartDate: new Date().toISOString().split('T')[0],
  });
  const [bulkImportResults, setBulkImportResults] = useState<BulkImportResult[] | null>(null);

  const { data: packages = [], isLoading: packagesLoading } = useGetAllPackages();
  const { data: isAdmin = false } = useIsCallerAdmin();
  const bulkCreateSubscribers = useBulkCreateSubscribers();
  const deleteAllSubscribers = useDeleteAllSubscribers();

  const handleOpenBulkImport = () => {
    setBulkImportData({
      names: '',
      packageId: packages[0]?.id.toString() || '',
      subscriptionStartDate: new Date().toISOString().split('T')[0],
    });
    setBulkImportResults(null);
    setIsBulkImportOpen(true);
  };

  const handleCloseBulkImport = () => {
    setIsBulkImportOpen(false);
    setBulkImportResults(null);
  };

  const handleOpenDeleteAll = () => {
    setIsDeleteAllOpen(true);
  };

  const handleCloseDeleteAll = () => {
    setIsDeleteAllOpen(false);
  };

  const handleDeleteAll = async () => {
    try {
      const result = await deleteAllSubscribers.mutateAsync();
      toast.success(`تم حذف ${result.subscribersDeleted} مشترك بنجاح`);
      handleCloseDeleteAll();
    } catch (error: any) {
      const errorMessage = error?.message || 'فشل حذف المشتركين. يرجى المحاولة مرة أخرى.';
      toast.error(errorMessage);
      console.error('Delete all subscribers error:', error);
    }
  };

  const handleBulkImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bulkImportData.names.trim()) {
      toast.error('Please enter at least one name');
      return;
    }

    if (!bulkImportData.packageId) {
      toast.error('Please select a package');
      return;
    }

    try {
      const startDate = new Date(bulkImportData.subscriptionStartDate).getTime() * 1000000;
      const results = await bulkCreateSubscribers.mutateAsync({
        names: bulkImportData.names,
        packageId: BigInt(bulkImportData.packageId),
        subscriptionStartDate: BigInt(startDate),
      });

      setBulkImportResults(results);

      const successCount = results.filter((r) => r.result).length;
      const failureCount = results.filter((r) => r.error).length;

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} subscriber(s)`);
      }
      if (failureCount > 0) {
        toast.error(`Failed to import ${failureCount} subscriber(s)`);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Bulk import failed. Please try again.';
      toast.error(errorMessage);
      console.error('Bulk import error:', error);
    }
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">المشتركون</h2>
          <p className="text-muted-foreground">إدارة مشتركي مركز الإنترنت</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Button onClick={handleOpenDeleteAll} variant="destructive">
                <Trash2 className="ml-2 h-4 w-4" />
                حذف الكل
              </Button>
              <Button onClick={handleOpenBulkImport} variant="outline">
                <Upload className="ml-2 h-4 w-4" />
                Bulk Import
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>المشتركون</CardTitle>
          <CardDescription>
            استخدم زر "Bulk Import" لإضافة مشتركين جدد، أو زر "حذف الكل" لحذف جميع المشتركين
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            لا توجد وظيفة عرض المشتركين متاحة حاليًا. يمكنك استخدام الاستيراد الجماعي لإضافة مشتركين.
          </div>
        </CardContent>
      </Card>

      {/* Bulk Import Dialog */}
      <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Import Subscribers</DialogTitle>
            <DialogDescription>
              Import multiple subscribers at once. Enter one name per line.
            </DialogDescription>
          </DialogHeader>
          {bulkImportResults ? (
            <div className="space-y-4">
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div className="space-y-2">
                  {bulkImportResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-2">
                        {result.result ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium">{result.name}</span>
                      </div>
                      {result.error && (
                        <span className="text-sm text-red-600">{result.error}</span>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <DialogFooter>
                <Button onClick={handleCloseBulkImport}>Close</Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleBulkImportSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="names">Names (one per line) *</Label>
                <Textarea
                  id="names"
                  placeholder="John Doe&#10;Jane Smith&#10;Bob Johnson"
                  value={bulkImportData.names}
                  onChange={(e) =>
                    setBulkImportData({ ...bulkImportData, names: e.target.value })
                  }
                  required
                  rows={10}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulkPackageId">Package *</Label>
                <Select
                  value={bulkImportData.packageId}
                  onValueChange={(value) =>
                    setBulkImportData({ ...bulkImportData, packageId: value })
                  }
                  required
                >
                  <SelectTrigger id="bulkPackageId">
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((pkg) => (
                      <SelectItem key={pkg.id.toString()} value={pkg.id.toString()}>
                        {pkg.name} - {formatUSD(pkg.priceUsd)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulkSubscriptionStartDate">Subscription Start Date</Label>
                <Input
                  id="bulkSubscriptionStartDate"
                  type="date"
                  value={bulkImportData.subscriptionStartDate}
                  onChange={(e) =>
                    setBulkImportData({
                      ...bulkImportData,
                      subscriptionStartDate: e.target.value,
                    })
                  }
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseBulkImport}>
                  Cancel
                </Button>
                <Button type="submit" disabled={bulkCreateSubscribers.isPending}>
                  {bulkCreateSubscribers.isPending ? 'Importing...' : 'Import'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع المشتركين وجميع بيانات الفواتير المرتبطة بهم بشكل دائم.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDeleteAll}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              disabled={deleteAllSubscribers.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAllSubscribers.isPending ? 'جاري الحذف...' : 'نعم، احذف الكل'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
