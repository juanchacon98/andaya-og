-- Create admin_notes table for internal admin notes on users
CREATE TABLE IF NOT EXISTS public.admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin notes
CREATE POLICY "Only admins can view admin notes"
  ON public.admin_notes
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin_primary'::app_role) OR 
    has_role(auth.uid(), 'admin_security'::app_role)
  );

-- Only admins can insert admin notes
CREATE POLICY "Only admins can insert admin notes"
  ON public.admin_notes
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin_primary'::app_role) OR 
    has_role(auth.uid(), 'admin_security'::app_role)
  );

-- Only admins can delete admin notes
CREATE POLICY "Only admins can delete admin notes"
  ON public.admin_notes
  FOR DELETE
  USING (
    has_role(auth.uid(), 'admin_primary'::app_role) OR 
    has_role(auth.uid(), 'admin_security'::app_role)
  );

-- Add trigger for updated_at
CREATE TRIGGER update_admin_notes_updated_at
  BEFORE UPDATE ON public.admin_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_admin_notes_user_id ON public.admin_notes(user_id);
CREATE INDEX idx_admin_notes_created_at ON public.admin_notes(created_at DESC);