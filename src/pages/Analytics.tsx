import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { toast } from "sonner";

const Analytics = () => {
  const [stats, setStats] = useState<any>({
    studentsByLevel: [],
    casesByType: [],
    monthlyTrends: [],
    absenceStats: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [studentsRes, casesRes, sessionsRes, absencesRes] = await Promise.all([
        supabase.from("students").select("school_level, status"),
        supabase.from("case_files").select("case_type, created_at"),
        supabase.from("sessions").select("created_at"),
        supabase.from("absences").select("absence_type, absence_date"),
      ]);

      // Process students by level
      const studentsByLevel = [
        { name: "ابتدائي", value: studentsRes.data?.filter(s => s.school_level === "primary" && s.status === "active").length || 0 },
        { name: "إعدادي", value: studentsRes.data?.filter(s => s.school_level === "middle" && s.status === "active").length || 0 },
        { name: "ثانوي", value: studentsRes.data?.filter(s => s.school_level === "high" && s.status === "active").length || 0 },
      ];

      // Process cases by type
      const casesByType = Object.entries(
        casesRes.data?.reduce((acc: any, curr) => {
          acc[curr.case_type] = (acc[curr.case_type] || 0) + 1;
          return acc;
        }, {}) || {}
      ).map(([name, value]) => ({ name, value }));

      // Process monthly trends (last 6 months)
      const monthlyTrends = generateMonthlyTrends(sessionsRes.data || []);

      // Process absence stats
      const absenceStats = [
        { name: "غياب مبرر", value: absencesRes.data?.filter(a => a.absence_type === "excused").length || 0 },
        { name: "غياب غير مبرر", value: absencesRes.data?.filter(a => a.absence_type === "unexcused").length || 0 },
        { name: "تأخر", value: absencesRes.data?.filter(a => a.absence_type === "late").length || 0 },
      ];

      setStats({
        studentsByLevel,
        casesByType,
        monthlyTrends,
        absenceStats,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("خطأ في تحميل الإحصائيات");
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyTrends = (sessions: any[]) => {
    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو"];
    return months.map((month, index) => ({
      name: month,
      جلسات: Math.floor(Math.random() * 50) + 10, // Placeholder
    }));
  };

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الإحصائيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">لوحة التحليلات</h1>
        <p className="text-muted-foreground">إحصائيات ورسوم بيانية للمتابعة</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>الطلاب حسب المستوى الدراسي</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.studentsByLevel}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الحالات حسب النوع</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.casesByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.casesByType.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الجلسات الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="جلسات" stroke="hsl(var(--primary))" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إحصائيات الغياب</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.absenceStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
