-- Deployment History Migration
-- Tracks all contract deployments for users

-- Create deployments table
CREATE TABLE IF NOT EXISTS public.deployments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  contract_address TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  network TEXT NOT NULL CHECK (network IN ('base-sepolia', 'base-mainnet')),
  gas_used BIGINT,
  contract_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deployments_project_id ON public.deployments(project_id);
CREATE INDEX IF NOT EXISTS idx_deployments_user_id ON public.deployments(user_id);
CREATE INDEX IF NOT EXISTS idx_deployments_created_at ON public.deployments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deployments_contract_address ON public.deployments(contract_address);

-- Enable Row Level Security
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;

-- Users can view their own deployments
CREATE POLICY "Users can view own deployments"
  ON public.deployments FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own deployments
CREATE POLICY "Users can create own deployments"
  ON public.deployments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view deployments for their projects
CREATE POLICY "Users can view deployments for owned projects"
  ON public.deployments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = deployments.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Add comment to table
COMMENT ON TABLE public.deployments IS 'Tracks all contract deployments for users across projects';
