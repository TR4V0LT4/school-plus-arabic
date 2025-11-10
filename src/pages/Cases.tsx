import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface CaseFile {
  id: string;
  student_name: string;
  student_code: string | null;
  school_level: string;
  department: string | null;
  class_name: string | null;
  case_type: string;
  priority: string;
  status: string;
  description: string;
  created_at: string;
}

const Cases = () => {
  const [cases, setCases] = useState<CaseFile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    student_name: "",
    student_code: "",
    school_level: "primary",
    department: "",
    class_name: "",
    case_type: "psychological",
    priority: "medium",
    description: "",
    notes: "",
  });

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    const { data, error } = await supabase
      .from("case_files")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("خطأ في تحميل البيانات");
    } else {
      setCases(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const { error } = await supabase.from("case_files").insert([
      {
        student_name: formData.student_name,
        student_code: formData.student_code || null,
        school_level: formData.school_level as "primary" | "middle" | "high",
        department: formData.department || null,
        class_name: formData.class_name || null,
        case_type: formData.case_type as "psychological" | "social" | "health" | "academic" | "behavioral" | "family" | "other",
        priority: formData.priority as "low" | "medium" | "high" | "urgent",
        description: formData.description,
        notes: formData.notes || null,
        created_by: user.id,
      },
    ]);

    if (error) {
      toast.error("حدث خطأ أثناء إضافة الحالة");
    } else {
      toast.success("تمت إضافة الحالة بنجاح");
      setIsDialogOpen(false);
      fetchCases();
      setFormData({
        student_name: "",
        student_code: "",
        school_level: "primary",
        department: "",
        class_name: "",
        case_type: "psychological",
        priority: "medium",
        description: "",
        notes: "",
      });
    }

    setLoading(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-destructive text-destructive-foreground";
      case "high":
        return "bg-warning text-warning-foreground";
      case "medium":
        return "bg-success text-success-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-primary text-primary-foreground";
      case "in_progress":
        return "bg-accent text-accent-foreground";
      case "resolved":
        return "bg-success text-success-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredCases = cases.filter((c) =>
    c.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.student_code && c.student_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ملفات الحالات</h1>
          <p className="text-muted-foreground">إدارة حالات الطلاب</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              إضافة حالة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إضافة حالة جديدة</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="student_name">اسم المتعلم(ة)</Label>
                  <Input
                    id="student_name"
                    value={formData.student_name}
                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student_code">رمز مسار</Label>
                  <Input
                    id="student_code"
                    value={formData.student_code}
                    onChange={(e) => setFormData({ ...formData, student_code: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="school_level">السلك</Label>
                  <Select value={formData.school_level} onValueChange={(value) => setFormData({ ...formData, school_level: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">ابتدائي</SelectItem>
                      <SelectItem value="middle">إعدادي</SelectItem>
                      <SelectItem value="high">ثانوي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">القسم</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class_name">الفصل</Label>
                  <Input
                    id="class_name"
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="case_type">نوع الحالة</Label>
                  <Select value={formData.case_type} onValueChange={(value) => setFormData({ ...formData, case_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="psychological">نفسية</SelectItem>
                      <SelectItem value="social">اجتماعية</SelectItem>
                      <SelectItem value="health">صحية</SelectItem>
                      <SelectItem value="academic">أكاديمية</SelectItem>
                      <SelectItem value="behavioral">سلوكية</SelectItem>
                      <SelectItem value="family">عائلية</SelectItem>
                      <SelectItem value="other">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">الأولوية</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفضة</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="high">مرتفعة</SelectItem>
                      <SelectItem value="urgent">عاجلة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">وصف الحالة</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات إضافية</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "جاري الحفظ..." : "حفظ"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="البحث عن حالة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="ml-2 h-4 w-4" />
          تصفية
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCases.map((caseFile) => (
          <Card key={caseFile.id} className="hover:shadow-lg transition-smooth">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{caseFile.student_name}</CardTitle>
                  {caseFile.student_code && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {caseFile.student_code}
                    </p>
                  )}
                </div>
                <Badge className={getPriorityColor(caseFile.priority)}>
                  {caseFile.priority === "urgent" && "عاجلة"}
                  {caseFile.priority === "high" && "مرتفعة"}
                  {caseFile.priority === "medium" && "متوسطة"}
                  {caseFile.priority === "low" && "منخفضة"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">
                  {caseFile.school_level === "primary" && "ابتدائي"}
                  {caseFile.school_level === "middle" && "إعدادي"}
                  {caseFile.school_level === "high" && "ثانوي"}
                </Badge>
                <Badge className={getStatusColor(caseFile.status)}>
                  {caseFile.status === "open" && "مفتوح"}
                  {caseFile.status === "in_progress" && "قيد المعالجة"}
                  {caseFile.status === "resolved" && "محلول"}
                  {caseFile.status === "closed" && "مغلق"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {caseFile.description}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {caseFile.case_type === "psychological" && "نفسية"}
                  {caseFile.case_type === "social" && "اجتماعية"}
                  {caseFile.case_type === "health" && "صحية"}
                  {caseFile.case_type === "academic" && "أكاديمية"}
                  {caseFile.case_type === "behavioral" && "سلوكية"}
                  {caseFile.case_type === "family" && "عائلية"}
                  {caseFile.case_type === "other" && "أخرى"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCases.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد حالات بعد</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Cases;