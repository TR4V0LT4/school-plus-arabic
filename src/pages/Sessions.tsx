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

interface Session {
  id: string;
  session_date: string;
  session_type: string;
  duration_minutes: number | null;
  notes: string | null;
  outcome: string | null;
  case_files: {
    student_name: string;
  };
}

const Sessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    case_id: "",
    session_date: "",
    session_type: "",
    duration_minutes: "",
    notes: "",
    outcome: "",
  });

  useEffect(() => {
    fetchSessions();
    fetchCases();
  }, []);

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from("sessions")
      .select("*, case_files(student_name)")
      .order("session_date", { ascending: false });

    if (error) {
      toast.error("خطأ في تحميل البيانات");
    } else {
      setSessions(data || []);
    }
  };

  const fetchCases = async () => {
    const { data, error } = await supabase
      .from("case_files")
      .select("id, student_name")
      .in("status", ["open", "in_progress"])
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

    const { error } = await supabase.from("sessions").insert([
      {
        case_id: formData.case_id,
        session_date: formData.session_date,
        session_type: formData.session_type,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        notes: formData.notes,
        outcome: formData.outcome,
        created_by: user.id,
      },
    ]);

    if (error) {
      toast.error("حدث خطأ أثناء إضافة الجلسة");
    } else {
      toast.success("تمت إضافة الجلسة بنجاح");
      setIsDialogOpen(false);
      fetchSessions();
      setFormData({
        case_id: "",
        session_date: "",
        session_type: "",
        duration_minutes: "",
        notes: "",
        outcome: "",
      });
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">الجلسات والتدخلات</h1>
          <p className="text-muted-foreground">تسجيل ومتابعة جلسات التدخل</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              إضافة جلسة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إضافة جلسة جديدة</DialogTitle>
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
                  <Label htmlFor="session_date">تاريخ الجلسة</Label>
                  <Input
                    id="session_date"
                    type="datetime-local"
                    value={formData.session_date}
                    onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration_minutes">المدة (دقائق)</Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="session_type">نوع الجلسة</Label>
                <Input
                  id="session_type"
                  value={formData.session_type}
                  onChange={(e) => setFormData({ ...formData, session_type: e.target.value })}
                  required
                  placeholder="مثال: جلسة فردية، جلسة عائلية..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات الجلسة</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="outcome">النتيجة / التوصيات</Label>
                <Textarea
                  id="outcome"
                  value={formData.outcome}
                  onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
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
        {sessions.map((session) => (
          <Card key={session.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{session.case_files.student_name}</CardTitle>
                  <CardDescription className="mt-1">
                    {format(new Date(session.session_date), "PPpp", { locale: ar })}
                  </CardDescription>
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-primary">{session.session_type}</div>
                  {session.duration_minutes && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {session.duration_minutes} دقيقة
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            {(session.notes || session.outcome) && (
              <CardContent className="space-y-3">
                {session.notes && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">ملاحظات:</h4>
                    <p className="text-sm text-muted-foreground">{session.notes}</p>
                  </div>
                )}
                {session.outcome && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">النتيجة:</h4>
                    <p className="text-sm text-muted-foreground">{session.outcome}</p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}

        {sessions.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">لا توجد جلسات مسجلة بعد</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Sessions;