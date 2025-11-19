import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette } from "lucide-react";

const Settings = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    school_name: "",
    class_assigned: "",
  });
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    primary_color: "#8b5cf6",
    accent_color: "#f4e4d7",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserRole();
      fetchPreferences();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      toast.error("خطأ في تحميل البيانات");
    } else if (data) {
      setProfile({
        full_name: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
        school_name: data.school_name || "",
        class_assigned: data.class_assigned || "",
      });
    }
  };

  const fetchPreferences = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      setPreferences({
        primary_color: data.primary_color || "#8b5cf6",
        accent_color: data.accent_color || "#f4e4d7",
      });
      if (data.theme) {
        setTheme(data.theme);
      }
    }
  };

  const fetchUserRole = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching user role:", error);
    } else if (data) {
      setUserRole(data.role);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        school_name: profile.school_name,
        class_assigned: profile.class_assigned,
      })
      .eq("id", user.id);

    if (profileError) {
      toast.error("حدث خطأ أثناء حفظ البيانات");
      setLoading(false);
      return;
    }

    // Save or update preferences
    const { error: prefError } = await supabase
      .from("user_preferences")
      .upsert({
        user_id: user.id,
        theme: theme || "system",
        primary_color: preferences.primary_color,
        accent_color: preferences.accent_color,
      });

    if (prefError) {
      toast.error("حدث خطأ أثناء حفظ التفضيلات");
    } else {
      toast.success("تم حفظ جميع الإعدادات بنجاح");
      // Apply theme colors dynamically
      applyThemeColors();
    }

    setLoading(false);
  };

  const applyThemeColors = () => {
    const root = document.documentElement;
    root.style.setProperty("--primary", preferences.primary_color);
    root.style.setProperty("--accent", preferences.accent_color);
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case "specialist":
        return "أخصائي اجتماعي";
      case "manager":
        return "مدير";
      case "regional_supervisor":
        return "مشرف إقليمي";
      default:
        return "مستخدم";
    }
  };

  return (
    <div className="space-y-6 ">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">الإعدادات</h1>
        <p className="text-muted-foreground">إدارة الحساب والإعدادات الشخصية</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>المعلومات الشخصية</CardTitle>
          <CardDescription>تحديث بياناتك الشخصية</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">الاسم الكامل</Label>
            <Input
              id="full_name"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" value={profile.email} disabled />
            <p className="text-xs text-muted-foreground">لا يمكن تغيير البريد الإلكتروني</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="school_name">اسم المدرسة</Label>
            <Input
              id="school_name"
              value={profile.school_name}
              onChange={(e) => setProfile({ ...profile, school_name: e.target.value })}
            />
          </div>

          {userRole === "specialist" && (
            <div className="space-y-2">
              <Label htmlFor="class_assigned">الفصل المخصص (للمعلمين)</Label>
              <Input
                id="class_assigned"
                value={profile.class_assigned}
                onChange={(e) => setProfile({ ...profile, class_assigned: e.target.value })}
                placeholder="مثال: 1-أ"
              />
            </div>
          )}

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <CardTitle>المظهر والثيم</CardTitle>
          </div>
          <CardDescription>تخصيص المظهر والألوان حسب تفضيلاتك</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>وضع المظهر</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">فاتح</SelectItem>
                <SelectItem value="dark">داكن</SelectItem>
                <SelectItem value="system">تلقائي (حسب النظام)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary_color">اللون الأساسي</Label>
            <div className="flex gap-2">
              <Input
                id="primary_color"
                type="color"
                value={preferences.primary_color}
                onChange={(e) => setPreferences({ ...preferences, primary_color: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                value={preferences.primary_color}
                onChange={(e) => setPreferences({ ...preferences, primary_color: e.target.value })}
                placeholder="#8b5cf6"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accent_color">اللون الثانوي</Label>
            <div className="flex gap-2">
              <Input
                id="accent_color"
                type="color"
                value={preferences.accent_color}
                onChange={(e) => setPreferences({ ...preferences, accent_color: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                value={preferences.accent_color}
                onChange={(e) => setPreferences({ ...preferences, accent_color: e.target.value })}
                placeholder="#f4e4d7"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الصلاحيات</CardTitle>
          <CardDescription>دورك في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">الدور الحالي:</span>
            <Badge variant="secondary" className="text-base">
              {getRoleLabel(userRole)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>حول النظام</CardTitle>
          <CardDescription>معلومات عن School+</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">الإصدار:</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">تاريخ الإصدار:</span>
            <span className="font-medium">2025</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;