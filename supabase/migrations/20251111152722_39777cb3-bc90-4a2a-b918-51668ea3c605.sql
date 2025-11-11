-- Create storage bucket for student files
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-files', 'student-files', false);

-- Create students table (enhanced version of case files)
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  student_name TEXT NOT NULL,
  student_code TEXT UNIQUE NOT NULL,
  school_level school_level NOT NULL,
  department TEXT,
  class_name TEXT,
  date_of_birth DATE,
  parent_name TEXT,
  parent_phone TEXT,
  parent_email TEXT,
  address TEXT,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'stopped', 'archived')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create student files table for attachments
CREATE TABLE public.student_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create absences table
CREATE TABLE public.absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  absence_date DATE NOT NULL,
  absence_type TEXT CHECK (absence_type IN ('excused', 'unexcused', 'late')),
  reason TEXT,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('upload', 'absence', 'deadline', 'system')),
  is_read BOOLEAN DEFAULT FALSE,
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students
CREATE POLICY "Users can view all students"
  ON public.students FOR SELECT
  USING (true);

CREATE POLICY "Users can create students"
  ON public.students FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update students they created or managers"
  ON public.students FOR UPDATE
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'regional_supervisor'::app_role));

CREATE POLICY "Managers can delete students"
  ON public.students FOR DELETE
  USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'regional_supervisor'::app_role));

-- RLS Policies for student_files
CREATE POLICY "Users can view all student files"
  ON public.student_files FOR SELECT
  USING (true);

CREATE POLICY "Users can upload student files"
  ON public.student_files FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete files they uploaded or managers"
  ON public.student_files FOR DELETE
  USING (auth.uid() = uploaded_by OR has_role(auth.uid(), 'manager'::app_role));

-- RLS Policies for absences
CREATE POLICY "Users can view all absences"
  ON public.absences FOR SELECT
  USING (true);

CREATE POLICY "Users can record absences"
  ON public.absences FOR INSERT
  WITH CHECK (auth.uid() = recorded_by);

CREATE POLICY "Users can update absences they recorded or managers"
  ON public.absences FOR UPDATE
  USING (auth.uid() = recorded_by OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Managers can delete absences"
  ON public.absences FOR DELETE
  USING (has_role(auth.uid(), 'manager'::app_role));

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Storage policies for student files
CREATE POLICY "Users can view student files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'student-files');

CREATE POLICY "Authenticated users can upload student files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'student-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their uploaded files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'student-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their uploaded files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'student-files' AND auth.role() = 'authenticated');

-- Triggers for updated_at
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_related_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, related_id)
  VALUES (p_user_id, p_title, p_message, p_type, p_related_id)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;