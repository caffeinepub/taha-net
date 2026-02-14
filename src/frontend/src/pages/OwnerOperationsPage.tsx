import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, DollarSign, LayoutDashboard, ArrowRight } from 'lucide-react';

type Page = 'operations' | 'dashboard' | 'subscribers' | 'billing' | 'myDues';

interface OwnerOperationsPageProps {
  onNavigate: (page: Page) => void;
}

export function OwnerOperationsPage({ onNavigate }: OwnerOperationsPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">عمليات المالك</h2>
        <p className="text-muted-foreground">إدارة جميع جوانب مركز الإنترنت</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Dashboard Card */}
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mt-4">لوحة التحكم</CardTitle>
            <CardDescription>
              نظرة عامة على الفواتير والإيرادات الشهرية والسنوية
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => onNavigate('dashboard')}
              variant="outline"
              className="w-full"
            >
              عرض لوحة التحكم
              <ArrowRight className="mr-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Subscribers Card */}
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mt-4">المشتركون</CardTitle>
            <CardDescription>
              إدارة المشتركين، الاستيراد الجماعي، وحذف البيانات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => onNavigate('subscribers')}
              variant="outline"
              className="w-full"
            >
              إدارة المشتركين
              <ArrowRight className="mr-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Billing Card */}
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mt-4">الفواتير الشهرية</CardTitle>
            <CardDescription>
              عرض وإدارة حالة الفواتير لكل مشترك حسب الشهر
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => onNavigate('billing')}
              variant="outline"
              className="w-full"
            >
              عرض الفواتير
              <ArrowRight className="mr-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>حول عمليات المالك</CardTitle>
          <CardDescription>نظرة عامة على الوظائف المتاحة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 className="mb-1 font-semibold text-foreground">لوحة التحكم</h4>
            <p>
              تعرض إحصائيات شاملة عن المستحقات الشهرية والسنوية، مما يساعدك على تتبع الإيرادات والمدفوعات المستحقة.
            </p>
          </div>
          <div>
            <h4 className="mb-1 font-semibold text-foreground">المشتركون</h4>
            <p>
              إدارة قاعدة بيانات المشتركين، استيراد مشتركين جدد بشكل جماعي، وحذف جميع البيانات عند الحاجة.
            </p>
          </div>
          <div>
            <h4 className="mb-1 font-semibold text-foreground">الفواتير الشهرية</h4>
            <p>
              عرض تفصيلي للمبالغ المستحقة من كل مشترك لشهر معين، مع إمكانية التصفية حسب السنة والشهر.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
