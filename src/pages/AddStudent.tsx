import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

const AddStudent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    student_name: "",
    student_code: "",
    school_level: "",
    department: "",
    class_name: "",
    date_of_birth: "",
    parent_name: "",
    parent_phone: "",
    parent_email: "",
    address: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("students").insert([{
        student_name: formData.student_name,
        student_code: formData.student_code,
        school_level: formData.school_level as "primary" | "middle" | "high",
        department: formData.department,
        class_name: formData.class_name,
        date_of_birth: formData.date_of_birth,
        parent_name: formData.parent_name,
        parent_phone: formData.parent_phone,
        parent_email: formData.parent_email,
        address: formData.address,
        notes: formData.notes,
        created_by: user.id,
        status: "active",
      }]);

      if (error) throw error;

      toast.success("تم إضافة الطالب بنجاح");
      navigate("/students");
    } catch (error: any) {
      console.error("Error adding student:", error);
      toast.error(error.message || "خطأ في إضافة الطالب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => navigate("/students")}>
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>إضافة طالب جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="student_name">اسم الطالب *</Label>
                <Input
                  id="student_name"
                  required
                  value={formData.student_name}
                  onChange={(e) =>
                    setFormData({ ...formData, student_name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="student_code">رمز الطالب *</Label>
                <Input
                  id="student_code"
                  required
                  value={formData.student_code}
                  onChange={(e) =>
                    setFormData({ ...formData, student_code: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="school_level">المستوى الدراسي *</Label>
                <Select
                  required
                  value={formData.school_level}
                  onValueChange={(value) =>
                    setFormData({ ...formData, school_level: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المستوى" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">ابتدائي</SelectItem>
                    <SelectItem value="middle">إعدادي</SelectItem>
                    <SelectItem value="secondary">ثانوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="class_name">القسم</Label>
                <Input
                  id="class_name"
                  value={formData.class_name}
                  onChange={(e) =>
                    setFormData({ ...formData, class_name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">القطاع</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">تاريخ الميلاد</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) =>
                    setFormData({ ...formData, date_of_birth: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent_name">اسم ولي الأمر</Label>
                <Input
                  id="parent_name"
                  value={formData.parent_name}
                  onChange={(e) =>
                    setFormData({ ...formData, parent_name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent_phone">رقم هاتف ولي الأمر</Label>
                <Input
                  id="parent_phone"
                  type="tel"
                  value={formData.parent_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, parent_phone: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent_email">بريد ولي الأمر الإلكتروني</Label>
                <Input
                  id="parent_email"
                  type="email"
                  value={formData.parent_email}
                  onChange={(e) =>
                    setFormData({ ...formData, parent_email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">العنوان</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                rows={4}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "جاري الحفظ..." : "حفظ"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/students")}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddStudent;
