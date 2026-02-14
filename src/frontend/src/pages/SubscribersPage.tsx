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

    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.packageId) {
      toast.error('Please fill in all required fields');
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
        toast.success('Subscriber updated successfully');
      } else {
        const dateMs = new Date(formData.subscriptionStartDate).getTime();
        const dateNs = BigInt(dateMs) * BigInt(1000000);

        await createSubscriber.mutateAsync({
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          packageId: BigInt(formData.packageId),
          subscriptionStartDate: dateNs,
        });
        toast.success('Subscriber created successfully');
      }
      handleCloseDialog();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save subscriber');
      console.error('Save subscriber error:', error);
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
      toast.success(subscriber.active ? 'Subscriber deactivated' : 'Subscriber reactivated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update subscriber status');
      console.error('Toggle active error:', error);
    }
  };

  const handleWhatsAppClick = (phone: string) => {
    if (!isValidWhatsAppPhone(phone)) {
      toast.error('Invalid phone number for WhatsApp');
      return;
    }
    try {
      openWhatsAppChat(phone);
    } catch (error) {
      toast.error('Failed to open WhatsApp');
    }
  };

  const getPackageName = (packageId: bigint): string => {
    const pkg = packages.find((p) => p.id === packageId);
    return pkg ? pkg.name : 'Unknown';
  };

  const getPackagePrice = (packageId: bigint): bigint => {
    const pkg = packages.find((p) => p.id === packageId);
    return pkg ? pkg.priceUsd : BigInt(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Subscribers</h2>
          <p className="text-muted-foreground">Manage your internet subscribers</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Subscriber
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Subscribers</CardTitle>
          <CardDescription>View and manage all active subscribers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {subscribersLoading || packagesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredSubscribers.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchQuery ? 'No subscribers found matching your search.' : 'No subscribers yet. Add your first subscriber to get started.'}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscribers.map((subscriber) => (
                    <TableRow key={subscriber.id.toString()}>
                      <TableCell className="font-medium">{subscriber.fullName}</TableCell>
                      <TableCell>{subscriber.phone}</TableCell>
                      <TableCell>{getPackageName(subscriber.packageId)}</TableCell>
                      <TableCell>{formatUSD(getPackagePrice(subscriber.packageId))}</TableCell>
                      <TableCell>
                        <Badge variant={subscriber.active ? 'default' : 'secondary'}>
                          {subscriber.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleWhatsAppClick(subscriber.phone)}
                            title="Open WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(subscriber)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(subscriber)}
                            title={subscriber.active ? 'Deactivate' : 'Reactivate'}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubscriber ? 'Edit Subscriber' : 'Add New Subscriber'}</DialogTitle>
            <DialogDescription>
              {editingSubscriber
                ? 'Update subscriber information'
                : 'Enter the details for the new subscriber'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                  disabled={!!editingSubscriber}
                />
                {editingSubscriber && (
                  <p className="text-xs text-muted-foreground">Phone number cannot be changed</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="packageId">Package *</Label>
                <Select
                  value={formData.packageId}
                  onValueChange={(value) => setFormData({ ...formData, packageId: value })}
                >
                  <SelectTrigger id="packageId">
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((pkg) => (
                      <SelectItem key={pkg.id.toString()} value={pkg.id.toString()}>
                        {pkg.name} - {formatUSD(pkg.priceUsd)}/month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!editingSubscriber && (
                <div className="space-y-2">
                  <Label htmlFor="subscriptionStartDate">Subscription Start Date *</Label>
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
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createSubscriber.isPending || updateSubscriber.isPending}>
                {createSubscriber.isPending || updateSubscriber.isPending
                  ? 'Saving...'
                  : editingSubscriber
                  ? 'Update'
                  : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
