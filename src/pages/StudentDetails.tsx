import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, FileText, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import * as mammoth from "mammoth";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface ExtractedStudent {
  student_code: string;
  student_name: string;
  school_level?: string;
  class_name?: string;
  department?: string;
  date_of_birth?: string;
  enrollment_date?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  address?: string;
  notes?: string;
  status?: string;
  validation?: {
    isValid: boolean;
    errors: string[];
  };
}

const StudentFileUpload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const validateStudent = (student: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!student.student_code || student.student_code.trim() === "") {
      errors.push("رمز الطالب مطلوب");
    }
    if (!student.student_name || student.student_name.trim() === "") {
      errors.push("اسم الطالب مطلوب");
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const normalizeColumnName = (name: string): string => {
    const mapping: Record<string, string> = {
      "رمز الطالب": "student_code",
      "كود الطالب": "student_code",
      "الرمز": "student_code",
      "اسم الطالب": "student_name",
      "الاسم": "student_name",
      "المستوى الدراسي": "school_level",
      "المستوى": "school_level",
      "القسم": "class_name",
      "الفصل": "class_name",
      "القطاع": "department",
      "تاريخ الميلاد": "date_of_birth",
      "الميلاد": "date_of_birth",
      "تاريخ التسجيل": "enrollment_date",
      "اسم ولي الأمر": "parent_name",
      "ولي الأمر": "parent_name",
      "هاتف ولي الأمر": "parent_phone",
      "الهاتف": "parent_phone",
      "البريد الإلكتروني": "parent_email",
      "الإيميل": "parent_email",
      "العنوان": "address",
      "ملاحظات": "notes",
      "الحالة": "status",
    };
    
    return mapping[name.trim()] || name.toLowerCase().replace(/\s+/g, "_");
  };

  const normalizeLevelValue = (value: string): string => {
    const levelMapping: Record<string, string> = {
      "ابتدائي": "primary",
      "primary": "primary",
      "إعدادي": "middle",
      "اعدادي": "middle",
      "middle": "middle",
      "ثانوي": "secondary",
      "secondary": "secondary",
    };
    
    return levelMapping[value.trim().toLowerCase()] || value;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.name.split(".").pop()?.toLowerCase();
      if (!["xlsx", "xls", "pdf", "docx", "doc"].includes(fileType || "")) {
        toast.error("نوع الملف غير مدعوم. يرجى رفع ملف Excel أو PDF أو Word");
        return;
      }
      setFile(selectedFile);
      setExtractedData([]);
    }
  };

  const extractFromExcel = async (file: File) => {
    return new Promise<ExtractedStudent[]>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (jsonData.length < 2) {
            reject(new Error("الملف فارغ أو لا يحتوي على بيانات كافية"));
            return;
          }

          const headers = jsonData[0].map((header: any) => normalizeColumnName(String(header)));
          const students: ExtractedStudent[] = [];

          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;

            const student: any = { status: "active" };
            headers.forEach((header, index) => {
              if (row[index] !== undefined && row[index] !== null && row[index] !== "") {
                let value = String(row[index]).trim();
                
                if (header === "school_level") {
                  value = normalizeLevelValue(value);
                }
                
                student[header] = value;
              }
            });

            if (student.student_code || student.student_name) {
              const validation = validateStudent(student);
              students.push({ ...student, validation });
            }
          }

          resolve(students);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("خطأ في قراءة الملف"));
      reader.readAsArrayBuffer(file);
    });
  };

  const extractFromPDF = async (file: File) => {
    toast.info("استخراج البيانات من PDF يتطلب معالجة يدوية. يرجى استخدام ملف Excel للاستيراد التلقائي.");
    return [];
  };

  const extractFromWord = async (file: File) => {
    return new Promise<ExtractedStudent[]>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          const text = result.value;
          
          // Basic text parsing - can be enhanced based on document structure
          const lines = text.split('\n').filter(line => line.trim());
          toast.info("تم استخراج النص من ملف Word. يفضل استخدام Excel للاستيراد المنظم.");
          
          resolve([]);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("خطأ في قراءة الملف"));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleExtract = async () => {
    if (!file) {
      toast.error("يرجى اختيار ملف أولاً");
      return;
    }

    setLoading(true);
    try {
      const fileType = file.name.split(".").pop()?.toLowerCase();
      let students: ExtractedStudent[] = [];

      if (fileType === "xlsx" || fileType === "xls") {
        students = await extractFromExcel(file);
      } else if (fileType === "pdf") {
        students = await extractFromPDF(file);
      } else if (fileType === "docx" || fileType === "doc") {
        students = await extractFromWord(file);
      }

      setExtractedData(students);
      
      if (students.length > 0) {
        toast.success(`تم استخراج ${students.length} طالب من الملف`);
      } else {
        toast.warning("لم يتم العثور على بيانات في الملف");
      }
    } catch (error) {
      console.error("Error extracting data:", error);
      toast.error("خطأ في استخراج البيانات من الملف");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadToDatabase = async () => {
    const validStudents = extractedData.filter(s => s.validation?.isValid);
    
    if (validStudents.length === 0) {
      toast.error("لا توجد بيانات صالحة للرفع");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (let i = 0; i < validStudents.length; i++) {
        const student = validStudents[i];
        const { validation, ...studentData } = student;
        const { data: { user } } = await supabase.auth.getUser();

        const dataToInsert = {
        ...studentData,
          created_by: user.id,
          status: studentData.status || 'active'
        };
        const { error } = await supabase.from("students").insert([dataToInsert]);

        if (error) {
          console.error(`Error inserting student ${student.student_code}:`, error);
          errorCount++;
        } else {
          successCount++;
        }

        setUploadProgress(Math.round(((i + 1) / validStudents.length) * 100));
      }

      if (successCount > 0) {
        toast.success(`تم رفع ${successCount} طالب بنجاح`);
      }
      if (errorCount > 0) {
        toast.error(`فشل رفع ${errorCount} طالب`);
      }

      if (successCount > 0) {
        setTimeout(() => navigate("/students"), 1500);
      }
    } catch (error) {
      console.error("Error uploading students:", error);
      toast.error("خطأ في رفع البيانات");
    } finally {
      setUploading(false);
    }
  };

  const validCount = extractedData.filter(s => s.validation?.isValid).length;
  const invalidCount = extractedData.length - validCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">رفع ملف الطلاب</h1>
          <p className="text-muted-foreground">استيراد بيانات الطلاب من ملف Excel أو PDF</p>
        </div>
        <Button variant="ghost" onClick={() => navigate("/students")}>
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>رفع الملف</CardTitle>
          <CardDescription>
            قم برفع ملف Excel يحتوي على بيانات الطلاب. يجب أن يحتوي الملف على أعمدة: رمز الطالب، اسم الطالب (كحد أدنى)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 border-dashed hover:border-primary/50 transition-colors">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <FileSpreadsheet className="h-12 w-12 text-green-500 mb-2" />
                <p className="text-sm font-medium">Excel</p>
                <p className="text-xs text-muted-foreground">.xlsx, .xls</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-dashed hover:border-primary/50 transition-colors">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <FileText className="h-12 w-12 text-red-500 mb-2" />
                <p className="text-sm font-medium">PDF</p>
                <p className="text-xs text-muted-foreground">.pdf</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-dashed hover:border-primary/50 transition-colors">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <FileText className="h-12 w-12 text-blue-500 mb-2" />
                <p className="text-sm font-medium">Word</p>
                <p className="text-xs text-muted-foreground">.docx, .doc</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">اختر الملف</Label>
            <div className="flex gap-2">
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls,.pdf,.docx,.doc"
                onChange={handleFileChange}
                disabled={loading || uploading}
              />
              <Button
                onClick={handleExtract}
                disabled={!file || loading || uploading}
              >
                {loading ? (
                  "جاري الاستخراج..."
                ) : (
                  <>
                    <Upload className="ml-2 h-4 w-4" />
                    استخراج البيانات
                  </>
                )}
              </Button>
            </div>
          </div>

          {file && (
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertDescription>
                الملف المحدد: <strong>{file.name}</strong>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {extractedData.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>البيانات المستخرجة</CardTitle>
                  <CardDescription>
                    تم العثور على {extractedData.length} سجل
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {validCount} صالح
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {invalidCount} غير صالح
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">رمز الطالب</TableHead>
                      <TableHead className="text-right">اسم الطالب</TableHead>
                      <TableHead className="text-right">المستوى</TableHead>
                      <TableHead className="text-right">القسم</TableHead>
                      <TableHead className="text-right">ولي الأمر</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extractedData.map((student, index) => (
                      <TableRow key={index} className={!student.validation?.isValid ? "bg-destructive/10" : ""}>
                        <TableCell>
                          {student.validation?.isValid ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{student.student_code}</TableCell>
                        <TableCell>{student.student_name}</TableCell>
                        <TableCell>{student.school_level || "-"}</TableCell>
                        <TableCell>{student.class_name || "-"}</TableCell>
                        <TableCell>{student.parent_name || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {uploading && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>جاري الرفع...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setExtractedData([])}>
                  إلغاء
                </Button>
                <Button
                  onClick={handleUploadToDatabase}
                  disabled={validCount === 0 || uploading}
                >
                  {uploading ? "جاري الرفع..." : `رفع ${validCount} طالب`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default StudentFileUpload;