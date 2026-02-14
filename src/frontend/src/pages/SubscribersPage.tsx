import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAllActiveSubscribers, useGetAllPackages, useCreateSubscriber, useUpdateSubscriber } from '../hooks/useQueries';
import { formatUSD } from '../lib/money';
import { openWhatsAppChat, isValidWhatsAppPhone } from '../lib/whatsapp';
import { toast } from 'sonner';
import { Plus, Search, Edit, MessageCircle, UserX, UserCheck } from 'lucide-react';
import type { Subscriber, Package } from '../backend';

type SubscriberFormData = {
  fullName: string;
  phone: string;
  packageId: string;
  subscriptionStartDate: string;
};

export function SubscribersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState<Subscriber | null>(null);
  const [formData, setFormData] = useState<SubscriberFormData>({
    fullName: '',
    phone: '',
    packageId: '',
    subscriptionStartDate: new Date().toISOString().split('T')[0],
  });

  const { data: subscribers = [], isLoading: subscribersLoading } = useGetAllActiveSubscribers();
  const { data: packages = [], isLoading: packagesLoading } = useGetAllPackages();
  const createSubscriber = useCreateSubscriber();
  const updateSubscriber = useUpdateSubscriber();

  const filteredSubscribers = subscribers.filter((sub) =>
    sub.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.phone.includes(searchQuery)
  );

  const handleOpenDialog = (subscriber?: Subscriber) => {
    if (subscriber) {
      setEditingSubscriber(subscriber);
      setFormData({
        fullName: subscriber.fullName,
        phone: subscriber.phone,
        packageId: subscriber.packageId.toString(),
        subscriptionStartDate: new Date(Number(subscriber.subscriptionStartDate) / 1000000)
          .toISOString()
          .split('T')[0],
      });
    } else {
      setEditingSubscriber(null);
      setFormData({
        fullName: '',
        phone: '',
        packageId: packages[0]?.id.toString() || '',
        subscriptionStartDate: new Date().toISOString().split('T')[0],
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSubscriber(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.error('يرجى إدخال الاسم الكامل');
      return;
    }

    if (!formData.phone.trim()) {
      toast.error('يرجى إدخال رقم الهاتف');
      return;
    }

    if (!formData.packageId) {
      toast.error('يرجى اختيار باقة');
      return;
    }

    try {
      if (editingSubscriber) {
        await updateSubscriber.mutateAsync({
          phone: editingSubscriber.phone,
          fullName: formData.fullName.trim(),
          packageId: BigInt(formData.packageId),
          active: editingSubscriber.active,
        });
        toast.success('تم تحديث المشترك بنجاح');
      } else {
        const startDate = new Date(formData.subscriptionStartDate).getTime() * 1000000;
        await createSubscriber.mutateAsync({
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          packageId: BigInt(formData.packageId),
          subscriptionStartDate: BigInt(startDate),
        });
        toast.success('تم إضافة المشترك بنجاح');
      }
      handleCloseDialog();
    } catch (error) {
      toast.error('فشلت العملية. يرجى المحاولة مرة أخرى.');
      console.error('Subscriber operation error:', error);
    }
  };

  const handleToggleActive = async (subscriber: Subscriber) => {
    try {
      await updateSubscriber.mutateAsync({
        phone: subscriber.phone,
        fullName: subscriber.fullName,
        packageId: subscriber.packageId,
        active: !subscriber.active,
      });
      toast.success(subscriber.active ? 'تم إلغاء تفعيل المشترك' : 'تم تفعيل المشترك');
    } catch (error) {
      toast.error('فشلت العملية. يرجى المحاولة مرة أخرى.');
      console.error('Toggle active error:', error);
    }
  };

  const handleWhatsApp = (phone: string) => {
    if (!isValidWhatsAppPhone(phone)) {
      toast.error('رقم الهاتف غير صالح لـ WhatsApp');
      return;
    }
    openWhatsAppChat(phone);
  };

  const getPackageName = (packageId: bigint) => {
    const pkg = packages.find((p) => p.id === packageId);
    return pkg ? pkg.name : 'غير معروف';
  };

  const getPackagePrice = (packageId: bigint) => {
    const pkg = packages.find((p) => p.id === packageId);
    return pkg ? formatUSD(pkg.priceUsd) : '$0.00';
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">المشتركون</h2>
          <p className="text-muted-foreground">إدارة مشتركي مركز الإنترنت</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة مشترك
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="البحث بالاسم أو رقم الهاتف..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Subscribers Table */}
      <Card>
        <CardHeader>
          <CardTitle>المشتركون النشطون</CardTitle>
          <CardDescription>قائمة بجميع المشتركين النشطين</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSubscribers.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchQuery ? 'لم يتم العثور على مشتركين' : 'لا يوجد مشتركون بعد'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم الكامل</TableHead>
                  <TableHead>رقم الهاتف</TableHead>
                  <TableHead>الباقة</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscribers.map((subscriber) => (
                  <TableRow key={subscriber.id.toString()}>
                    <TableCell className="font-medium">{subscriber.fullName}</TableCell>
                    <TableCell className="font-mono">{subscriber.phone}</TableCell>
                    <TableCell>{getPackageName(subscriber.packageId)}</TableCell>
                    <TableCell>{getPackagePrice(subscriber.packageId)}</TableCell>
                    <TableCell>
                      {subscriber.active ? (
                        <Badge variant="default">نشط</Badge>
                      ) : (
                        <Badge variant="secondary">غير نشط</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-start gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(subscriber)}
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleWhatsApp(subscriber.phone)}
                          title="فتح WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(subscriber)}
                          title={subscriber.active ? 'إلغاء التفعيل' : 'تفعيل'}
                        >
                          {subscriber.active ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubscriber ? 'تعديل المشترك' : 'إضافة مشترك جديد'}</DialogTitle>
            <DialogDescription>
              {editingSubscriber
                ? 'تحديث معلومات المشترك'
                : 'أدخل معلومات المشترك الجديد'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                placeholder="أدخل الاسم الكامل"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                placeholder="أدخل رقم الهاتف"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!!editingSubscriber}
              />
              {editingSubscriber && (
                <p className="text-xs text-muted-foreground">لا يمكن تغيير رقم الهاتف</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="packageId">الباقة</Label>
              <Select
                value={formData.packageId}
                onValueChange={(value) => setFormData({ ...formData, packageId: value })}
              >
                <SelectTrigger id="packageId">
                  <SelectValue placeholder="اختر باقة" />
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
            {!editingSubscriber && (
              <div className="space-y-2">
                <Label htmlFor="subscriptionStartDate">تاريخ بدء الاشتراك</Label>
                <Input
                  id="subscriptionStartDate"
                  type="date"
                  value={formData.subscriptionStartDate}
                  onChange={(e) =>
                    setFormData({ ...formData, subscriptionStartDate: e.target.value })
                  }
                />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createSubscriber.isPending || updateSubscriber.isPending}
              >
                {createSubscriber.isPending || updateSubscriber.isPending
                  ? 'جاري الحفظ...'
                  : editingSubscriber
                  ? 'تحديث'
                  : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
