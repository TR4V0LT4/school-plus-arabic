import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarIcon, Search, CheckCircle2, XCircle, Clock, FileText } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";

interface Student {
  id: string;
  student_name: string;
  student_code: string;
  class_name: string;
  school_level: string;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: string;
  notes: string | null;
  students: Student;
}

const Attendance = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, { status: string; notes: string }>>({});
  const [existingAttendance, setExistingAttendance] = useState<AttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<string[]>([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchAttendanceForDate();
  }, [selectedDate]);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("students")
      .select("id, student_name, student_code, class_name, school_level")
      .eq("status", "active")
      .order("student_name");

    if (error) {
      toast.error("خطأ في تحميل الطلاب");
      return;
    }

    if (data) {
      setStudents(data);
      const uniqueClasses = [...new Set(data.map((s) => s.class_name).filter(Boolean))] as string[];
      setClasses(uniqueClasses);
    }
  };

  const fetchAttendanceForDate = async () => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const { data, error } = await supabase
      .from("attendance")
      .select("*, students(*)")
      .eq("date", dateStr);

    if (error) {
      console.error("Error fetching attendance:", error);
      return;
    }

    if (data) {
      setExistingAttendance(data);
      const attendanceMap: Record<string, { status: string; notes: string }> = {};
      data.forEach((record) => {
        attendanceMap[record.student_id] = {
          status: record.status,
          notes: record.notes || "",
        };
      });
      setAttendance(attendanceMap);
    }
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        status,
        notes: prev[studentId]?.notes || "",
      },
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || "present",
        notes,
      },
    }));
  };

  const handleSaveAttendance = async () => {
    setLoading(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("يجب تسجيل الدخول");
      setLoading(false);
      return;
    }

    const updates = Object.entries(attendance).map(([studentId, data]) => ({
      student_id: studentId,
      date: dateStr,
      status: data.status,
      notes: data.notes || null,
      recorded_by: user.id,
    }));

    // Delete existing records for this date
    await supabase.from("attendance").delete().eq("date", dateStr);

    // Insert new records
    const { error } = await supabase.from("attendance").insert(updates);

    if (error) {
      toast.error("خطأ في حفظ الحضور");
      console.error(error);
    } else {
      toast.success("تم حفظ الحضور بنجاح");
      fetchAttendanceForDate();
    }

    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "absent":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "late":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "justified":
        return <FileText className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "present":
        return "حاضر";
      case "absent":
        return "غائب";
      case "late":
        return "متأخر";
      case "justified":
        return "غياب مبرر";
      default:
        return "";
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.student_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filterClass === "all" || student.class_name === filterClass;
    const matchesLevel = filterLevel === "all" || student.school_level === filterLevel;
    return matchesSearch && matchesClass && matchesLevel;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">تسجيل الحضور والغياب</h1>
        <p className="text-muted-foreground">إدارة حضور وغياب الطلاب اليومي</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الفلاتر والبحث</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-right">
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {format(selectedDate, "PPP", { locale: ar })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>البحث</Label>
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن طالب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>الفصل</Label>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الفصول" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفصول</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>المستوى</Label>
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع المستويات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المستويات</SelectItem>
                  <SelectItem value="primary">ابتدائي</SelectItem>
                  <SelectItem value="middle">إعدادي</SelectItem>
                  <SelectItem value="high">ثانوي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>قائمة الحضور ({filteredStudents.length} طالب)</CardTitle>
            <Button onClick={handleSaveAttendance} disabled={loading}>
              {loading ? "جاري الحفظ..." : "حفظ الحضور"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رمز الطالب</TableHead>
                <TableHead className="text-right">اسم الطالب</TableHead>
                <TableHead className="text-right">الفصل</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">ملاحظات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.student_code}</TableCell>
                  <TableCell className="font-medium">{student.student_name}</TableCell>
                  <TableCell>{student.class_name}</TableCell>
                  <TableCell>
                    <Select
                      value={attendance[student.id]?.status || "present"}
                      onValueChange={(value) => handleStatusChange(student.id, value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            حاضر
                          </div>
                        </SelectItem>
                        <SelectItem value="absent">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            غائب
                          </div>
                        </SelectItem>
                        <SelectItem value="late">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-500" />
                            متأخر
                          </div>
                        </SelectItem>
                        <SelectItem value="justified">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            غياب مبرر
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="ملاحظات..."
                      value={attendance[student.id]?.notes || ""}
                      onChange={(e) => handleNotesChange(student.id, e.target.value)}
                      className="max-w-xs"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;
