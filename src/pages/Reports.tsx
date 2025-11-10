import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, TrendingUp, Users, FileText } from "lucide-react";

const Reports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">التقارير والإحصائيات</h1>
        <p className="text-muted-foreground">تحليلات شاملة ونماذج التقارير</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-smooth">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>تقرير شهري</CardTitle>
                <CardDescription>ملخص النشاطات والحالات الشهرية</CardDescription>
              </div>
              <div className="rounded-lg bg-primary/10 p-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <FileDown className="ml-2 h-4 w-4" />
              تصدير PDF
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-smooth">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>تقرير الحالات</CardTitle>
                <CardDescription>توزيع وإحصائيات الحالات</CardDescription>
              </div>
              <div className="rounded-lg bg-success/10 p-3">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <FileDown className="ml-2 h-4 w-4" />
              تصدير Excel
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-smooth">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>تقرير الجلسات</CardTitle>
                <CardDescription>ملخص جلسات التدخل والمتابعة</CardDescription>
              </div>
              <div className="rounded-lg bg-accent/10 p-3">
                <Users className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <FileDown className="ml-2 h-4 w-4" />
              تصدير PDF
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-smooth">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>تقرير التواصل</CardTitle>
                <CardDescription>سجل التواصل مع أولياء الأمور</CardDescription>
              </div>
              <div className="rounded-lg bg-warning/10 p-3">
                <FileText className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <FileDown className="ml-2 h-4 w-4" />
              تصدير CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>إحصائيات سنوية</CardTitle>
          <CardDescription>نظرة شاملة على العام الدراسي</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="font-medium">إجمالي الحالات المعالجة</span>
              <span className="text-2xl font-bold text-primary">156</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="font-medium">عدد الجلسات المنجزة</span>
              <span className="text-2xl font-bold text-success">342</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="font-medium">نسبة النجاح</span>
              <span className="text-2xl font-bold text-accent">87%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>دليل الأخصائي الاجتماعي</CardTitle>
          <CardDescription>معلومات ونصائح مفيدة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none text-foreground">
            <h3 className="text-lg font-semibold mb-3">مهام الأخصائي الاجتماعي:</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>تقديم النصح والإرشاد النفسي والاجتماعي للطلاب</li>
              <li>متابعة الحالات الخاصة والتدخل في الوقت المناسب</li>
              <li>التواصل المستمر مع أولياء الأمور والإدارة التربوية</li>
              <li>إعداد التقارير والإحصائيات الدورية</li>
              <li>تنظيم الأنشطة الاجتماعية والتوعوية</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;