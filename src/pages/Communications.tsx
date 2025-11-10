import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Communication {
  id: string;
  communication_date: string;
  communication_type: string;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  message: string;
  response: string | null;
  case_files: {
    student_name: string;
  };
}

const Communications = () => {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    case_id: "",
    communication_date: "",
    communication_type: "phone",
    parent_name: "",
    parent_phone: "",
    parent_email: "",
    message: "",
    response: "",
  });

  useEffect(() => {
    fetchCommunications();
    fetchCases();
  }, []);

  const fetchCommunications = async () => {
    const { data, error } = await supabase
      .from("communications")
      .select("*, case_files(student_name)")
      .order("communication_date", { ascending: false });

    if (error) {
      toast.error("خطأ في تحميل البيانات");
    } else {
      setCommunications(data || []);
    }
  };

  const fetchCases = async () => {
    const { data, error } = await supabase
      .from("case_files")
      .select("id, student_name")
      .order("student_name");

    if (error) {
      toast.error("خطأ في تحميل الحالات");
    } else {
      setCases(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const { error } = await supabase.from("communications").insert([
      {
        case_id: formData.case_id,
        communication_date: formData.communication_date,
        communication_type: formData.communication_type,
        parent_name: formData.parent_name || null,
        parent_phone: formData.parent_phone || null,
        parent_email: formData.parent_email || null,
        message: formData.message,
        response: formData.response || null,
        created_by: user.id,
      },
    ]);

    if (error) {
      toast.error("حدث خطأ أثناء إضافة التواصل");
    } else {
      toast.success("تمت إضافة التواصل بنجاح");
      setIsDialogOpen(false);
      fetchCommunications();
      setFormData({
        case_id: "",
        communication_date: "",
        communication_type: "phone",
        parent_name: "",
        parent_phone: "",
        parent_email: "",
        message: "",
        response: "",
      });
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">التواصل مع أولياء الأمور</h1>
          <p className="text-muted-foreground">تسجيل ومتابعة التواصل مع الأهل</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              إضافة تواصل جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إضافة تواصل جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="case_id">الحالة المرتبطة</Label>
                <Select value={formData.case_id} onValueChange={(value) => setFormData({ ...formData, case_id: value })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر حالة..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cases.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.student_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="communication_date">تاريخ التواصل</Label>
                  <Input
                    id="communication_date"
                    type="datetime-local"
                    value={formData.communication_date}
                    onChange={(e) => setFormData({ ...formData, communication_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="communication_type">نوع التواصل</Label>
                  <Select value={formData.communication_type} onValueChange={(value) => setFormData({ ...formData, communication_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">هاتف</SelectItem>
                      <SelectItem value="email">بريد إلكتروني</SelectItem>
                      <SelectItem value="meeting">اجتماع</SelectItem>
                      <SelectItem value="sms">رسالة نصية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent_name">اسم ولي الأمر</Label>
                <Input
                  id="parent_name"
                  value={formData.parent_name}
                  onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parent_phone">رقم الهاتف</Label>
                  <Input
                    id="parent_phone"
                    type="tel"
                    value={formData.parent_phone}
                    onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent_email">البريد الإلكتروني</Label>
                  <Input
                    id="parent_email"
                    type="email"
                    value={formData.parent_email}
                    onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">الرسالة / الموضوع</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="response">الرد / الملاحظات</Label>
                <Textarea
                  id="response"
                  value={formData.response}
                  onChange={(e) => setFormData({ ...formData, response: e.target.value })}
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

      <div className="grid gap-4">
        {communications.map((comm) => (
          <Card key={comm.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{comm.case_files.student_name}</CardTitle>
                  <CardDescription className="mt-1">
                    {format(new Date(comm.communication_date), "PPpp", { locale: ar })}
                  </CardDescription>
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-primary">
                    {comm.communication_type === "phone" && "هاتف"}
                    {comm.communication_type === "email" && "بريد إلكتروني"}
                    {comm.communication_type === "meeting" && "اجتماع"}
                    {comm.communication_type === "sms" && "رسالة نصية"}
                  </div>
                  {comm.parent_name && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {comm.parent_name}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold mb-1">الرسالة:</h4>
                <p className="text-sm text-muted-foreground">{comm.message}</p>
              </div>
              {comm.response && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">الرد:</h4>
                  <p className="text-sm text-muted-foreground">{comm.response}</p>
                </div>
              )}
              {(comm.parent_phone || comm.parent_email) && (
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {comm.parent_phone && <span>📞 {comm.parent_phone}</span>}
                  {comm.parent_email && <span>✉️ {comm.parent_email}</span>}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {communications.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">لا توجد سجلات تواصل بعد</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Communications;