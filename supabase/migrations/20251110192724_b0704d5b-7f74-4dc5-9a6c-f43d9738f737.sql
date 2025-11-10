-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('specialist', 'manager', 'regional_supervisor');

-- Create enum for case types
CREATE TYPE public.case_type AS ENUM ('psychological', 'social', 'health', 'academic', 'behavioral', 'family', 'other');

-- Create enum for case priorities
CREATE TYPE public.case_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create enum for case status
CREATE TYPE public.case_status AS ENUM ('open', 'in_progress', 'resolved', 'closed', 'archived');

-- Create enum for school levels
CREATE TYPE public.school_level AS ENUM ('primary', 'middle', 'high');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  school_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'specialist',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create case_files table
CREATE TABLE public.case_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  student_code TEXT,
  school_level school_level NOT NULL,
  department TEXT,
  class_name TEXT,
  case_type case_type NOT NULL,
  priority case_priority NOT NULL DEFAULT 'medium',
  status case_status NOT NULL DEFAULT 'open',
  description TEXT NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.case_files(id) ON DELETE CASCADE,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER,
  session_type TEXT NOT NULL,
  notes TEXT,
  outcome TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create communications table
CREATE TABLE public.communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.case_files(id) ON DELETE CASCADE,
  communication_date TIMESTAMP WITH TIME ZONE NOT NULL,
  communication_type TEXT NOT NULL,
  parent_name TEXT,
  parent_phone TEXT,
  parent_email TEXT,
  message TEXT NOT NULL,
  response TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_case_files_updated_at BEFORE UPDATE ON public.case_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_communications_updated_at BEFORE UPDATE ON public.communications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles" ON public.user_roles
  FOR SELECT USING (true);

CREATE POLICY "Managers can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'regional_supervisor'));

-- RLS Policies for case_files
CREATE POLICY "Users can view all cases" ON public.case_files
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create cases" ON public.case_files
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update cases they created" ON public.case_files
  FOR UPDATE USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'regional_supervisor'));

CREATE POLICY "Managers can delete cases" ON public.case_files
  FOR DELETE USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'regional_supervisor'));

-- RLS Policies for sessions
CREATE POLICY "Users can view all sessions" ON public.sessions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create sessions" ON public.sessions
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update sessions they created" ON public.sessions
  FOR UPDATE USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can delete sessions" ON public.sessions
  FOR DELETE USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'regional_supervisor'));

-- RLS Policies for communications
CREATE POLICY "Users can view all communications" ON public.communications
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create communications" ON public.communications
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update communications they created" ON public.communications
  FOR UPDATE USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can delete communications" ON public.communications
  FOR DELETE USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'regional_supervisor'));

-- Create trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    NEW.email
  );
  
  -- Assign default specialist role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'specialist');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();