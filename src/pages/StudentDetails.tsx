import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Edit, FileDown, Upload } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const StudentDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [absences, setAbsences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && id) {
      fetchStudentData();
    }
  }, [user, id]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const [studentRes, filesRes, absencesRes] = await Promise.all([
        supabase.from("students").select("*").eq("id", id).single(),
        supabase.from("student_files").select("*").eq("student_id", id),
        supabase.from("absences").select("*").eq("student_id", id).order("absence_date", { ascending: false }),
      ]);

      if (studentRes.error) throw studentRes.error;
      setStudent(studentRes.data);
      setFiles(filesRes.data || []);
      setAbsences(absencesRes.data || []);
    } catch (error) {
      console.error("Error fetching student data:", error);
      toast.error("خطأ في تحميل بيانات الطالب");
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("student-files")
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("تم تحميل الملف بنجاح");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("خطأ في تحميل الملف");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">الطالب غير موجود</p>
        <Button onClick={() => navigate("/students")} className="mt-4">
          العودة للقائمة
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/students")}>
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة
        </Button>
        <Button onClick={() => navigate(`/students/${id}/edit`)}>
          <Edit className="ml-2 h-4 w-4" />
          تعديل
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{student.student_name}</CardTitle>
            <Badge variant={student.status === "active" ? "default" : "secondary"}>
              {student.status === "active" ? "نشط" : student.status === "stopped" ? "متوقف" : "مؤرشف"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">رمز الطالب</p>
              <p className="font-medium">{student.student_code}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">المستوى الدراسي</p>
              <p className="font-medium">
                {student.school_level === "primary" ? "ابتدائي" : student.school_level === "middle" ? "إعدادي" : "ثانوي"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">القسم</p>
              <p className="font-medium">{student.class_name || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">القطاع</p>
              <p className="font-medium">{student.department || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">تاريخ الميلاد</p>
              <p className="font-medium">{student.date_of_birth || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">تاريخ التسجيل</p>
              <p className="font-medium">{student.enrollment_date || "-"}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">معلومات ولي الأمر</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">الاسم</p>
                <p className="font-medium">{student.parent_name || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                <p className="font-medium">{student.parent_phone || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                <p className="font-medium">{student.parent_email || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">العنوان</p>
                <p className="font-medium">{student.address || "-"}</p>
              </div>
            </div>
          </div>

          {student.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">ملاحظات</h3>
                <p className="text-muted-foreground">{student.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="files">
        <TabsList>
          <TabsTrigger value="files">الملفات المرفقة</TabsTrigger>
          <TabsTrigger value="absences">سجل الغياب</TabsTrigger>
        </TabsList>

        <TabsContent value="files">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>الملفات المرفقة</CardTitle>
                <Button size="sm" onClick={() => navigate(`/students/${id}/upload`)}>
                  <Upload className="ml-2 h-4 w-4" />
                  رفع ملف
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد ملفات مرفقة</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">اسم الملف</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">تاريخ الرفع</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell className="font-medium">{file.file_name}</TableCell>
                        <TableCell>{file.file_type || "-"}</TableCell>
                        <TableCell>{new Date(file.uploaded_at).toLocaleDateString("ar-MA")}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadFile(file.file_path, file.file_name)}
                          >
                            <FileDown className="h-4 w-4" />
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

        <TabsContent value="absences">
          <Card>
            <CardHeader>
              <CardTitle>سجل الغياب</CardTitle>
            </CardHeader>
            <CardContent>
              {absences.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا يوجد سجل غياب</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">السبب</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {absences.map((absence) => (
                      <TableRow key={absence.id}>
                        <TableCell>{new Date(absence.absence_date).toLocaleDateString("ar-MA")}</TableCell>
                        <TableCell>
                          <Badge variant={absence.absence_type === "excused" ? "secondary" : "destructive"}>
                            {absence.absence_type === "excused" ? "غياب مبرر" : absence.absence_type === "unexcused" ? "غياب غير مبرر" : "تأخر"}
                          </Badge>
                        </TableCell>
                        <TableCell>{absence.reason || "-"}</TableCell>
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

export default StudentDetails;
