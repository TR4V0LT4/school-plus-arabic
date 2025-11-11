import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Upload, FileDown } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Students = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");

  useEffect(() => {
    if (user) {
      fetchStudents();
    }
  }, [user, statusFilter]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("خطأ في تحميل بيانات الطلاب");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === "all" || student.school_level === filterLevel;
    const matchesClass = filterClass === "all" || student.class_name === filterClass;
    return matchesSearch && matchesLevel && matchesClass;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: "default",
      stopped: "destructive",
      archived: "secondary",
    };
    const labels: Record<string, string> = {
      active: "نشط",
      stopped: "متوقف",
      archived: "مؤرشف",
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      primary: "ابتدائي",
      middle: "إعدادي",
      secondary: "ثانوي",
    };
    return labels[level] || level;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">إدارة الطلاب</h1>
          <p className="text-muted-foreground">عرض وإدارة بيانات الطلاب</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/students/upload")} variant="outline">
            <Upload className="ml-2 h-4 w-4" />
            رفع ملف
          </Button>
          <Button onClick={() => navigate("/students/add")}>
            <Plus className="ml-2 h-4 w-4" />
            إضافة طالب
          </Button>
        </div>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="active">النشطون</TabsTrigger>
          <TabsTrigger value="stopped">المتوقفون</TabsTrigger>
          <TabsTrigger value="archived">المؤرشفون</TabsTrigger>
          <TabsTrigger value="all">الكل</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>البحث والتصفية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="البحث بالاسم أو الرمز..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="المستوى الدراسي" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المستويات</SelectItem>
                    <SelectItem value="primary">ابتدائي</SelectItem>
                    <SelectItem value="middle">إعدادي</SelectItem>
                    <SelectItem value="secondary">ثانوي</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="القسم" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الأقسام</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={fetchStudents}>
                  تحديث
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  جاري التحميل...
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  لا توجد بيانات
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رمز الطالب</TableHead>
                      <TableHead className="text-right">الاسم</TableHead>
                      <TableHead className="text-right">المستوى</TableHead>
                      <TableHead className="text-right">القسم</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow
                        key={student.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/students/${student.id}`)}
                      >
                        <TableCell className="font-medium">
                          {student.student_code}
                        </TableCell>
                        <TableCell>{student.student_name}</TableCell>
                        <TableCell>{getLevelLabel(student.school_level)}</TableCell>
                        <TableCell>{student.class_name || "-"}</TableCell>
                        <TableCell>{getStatusBadge(student.status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/students/${student.id}`);
                            }}
                          >
                            عرض
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Students;
