import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, MessageSquare, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCases: 0,
    openCases: 0,
    totalSessions: 0,
    totalCommunications: 0,
  });
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      const [casesResult, sessionsResult, commsResult] = await Promise.all([
        supabase.from("case_files").select("id, status", { count: "exact" }),
        supabase.from("sessions").select("id", { count: "exact" }),
        supabase.from("communications").select("id", { count: "exact" }),
      ]);

      const openCases = casesResult.data?.filter(c => c.status === "open" || c.status === "in_progress").length || 0;

      setStats({
        totalCases: casesResult.count || 0,
        openCases,
        totalSessions: sessionsResult.count || 0,
        totalCommunications: commsResult.count || 0,
      });
    };

    fetchStats();
  }, [user]);

  const statCards = [
    {
      title: "إجمالي الحالات",
      value: stats.totalCases,
      icon: FileText,
      description: "عدد جميع ملفات الحالات",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "الحالات النشطة",
      value: stats.openCases,
      icon: AlertCircle,
      description: "حالات قيد المتابعة",
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "الجلسات",
      value: stats.totalSessions,
      icon: Users,
      description: "عدد جلسات التدخل",
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "التواصل",
      value: stats.totalCommunications,
      icon: MessageSquare,
      description: "عدد اتصالات أولياء الأمور",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">لوحة القيادة</h1>
        <p className="text-muted-foreground">نظرة عامة على النشاطات والإحصائيات</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="transition-smooth hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>الحالات حسب النوع</CardTitle>
            <CardDescription>توزيع أنواع الحالات المسجلة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["نفسية", "اجتماعية", "صحية", "أكاديمية", "سلوكية"].map((type) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{type}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: "60%" }}></div>
                    </div>
                    <span className="text-sm font-medium">12</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الأولوية</CardTitle>
            <CardDescription>توزيع الحالات حسب مستوى الأولوية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">عاجلة</span>
                <span className="text-sm font-medium text-destructive">5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">مرتفعة</span>
                <span className="text-sm font-medium text-warning">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">متوسطة</span>
                <span className="text-sm font-medium text-success">20</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">منخفضة</span>
                <span className="text-sm font-medium text-muted-foreground">8</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;