import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSaveCallerUserProfile } from '../../hooks/useQueries';
import { toast } from 'sonner';

export function ProfileSetupModal() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('يرجى إدخال اسمك');
      return;
    }
    
    if (!phone.trim()) {
      toast.error('يرجى إدخال رقم هاتفك');
      return;
    }

    try {
      await saveProfile.mutateAsync({ name: name.trim(), phone: phone.trim() });
      toast.success('تم إنشاء الملف الشخصي بنجاح!');
    } catch (error) {
      toast.error('فشل إنشاء الملف الشخصي. يرجى المحاولة مرة أخرى.');
      console.error('Profile setup error:', error);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>مرحباً بك في TAHA @NET</DialogTitle>
          <DialogDescription>
            يرجى إعداد ملفك الشخصي للمتابعة.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">الاسم الكامل</Label>
            <Input
              id="name"
              placeholder="أدخل اسمك الكامل"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              placeholder="أدخل رقم هاتفك"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={saveProfile.isPending}>
            {saveProfile.isPending ? 'جاري إنشاء الملف الشخصي...' : 'متابعة'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
