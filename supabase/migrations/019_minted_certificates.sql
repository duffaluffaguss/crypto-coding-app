-- Migration: Minted Certificates Tracking
-- Tracks NFT certificates minted for completed projects

-- Create minted_certificates table
CREATE TABLE IF NOT EXISTS public.minted_certificates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  token_id BIGINT NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  wallet_address TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  contract_address TEXT NOT NULL,
  minted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Metadata snapshot at time of mint
  project_name TEXT NOT NULL,
  project_type TEXT NOT NULL,
  
  -- Ensure uniqueness of token per chain
  UNIQUE(token_id, chain_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_minted_certificates_user_id 
  ON public.minted_certificates(user_id);

CREATE INDEX IF NOT EXISTS idx_minted_certificates_project_id 
  ON public.minted_certificates(project_id);

CREATE INDEX IF NOT EXISTS idx_minted_certificates_wallet 
  ON public.minted_certificates(wallet_address);

CREATE INDEX IF NOT EXISTS idx_minted_certificates_token_chain 
  ON public.minted_certificates(token_id, chain_id);

CREATE INDEX IF NOT EXISTS idx_minted_certificates_minted_at 
  ON public.minted_certificates(minted_at DESC);

-- Enable Row Level Security
ALTER TABLE public.minted_certificates ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view their own minted certificates
CREATE POLICY "Users can view own minted certificates"
  ON public.minted_certificates FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own minted certificates
CREATE POLICY "Users can create own minted certificates"
  ON public.minted_certificates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Public can view certificates by wallet address (for verification)
CREATE POLICY "Anyone can view certificates by wallet"
  ON public.minted_certificates FOR SELECT
  TO authenticated
  USING (true);

-- Comments for documentation
COMMENT ON TABLE public.minted_certificates IS 'Tracks NFT certificates minted for completed projects';
COMMENT ON COLUMN public.minted_certificates.token_id IS 'The NFT token ID on the blockchain';
COMMENT ON COLUMN public.minted_certificates.project_id IS 'Reference to the completed project';
COMMENT ON COLUMN public.minted_certificates.user_id IS 'Reference to the user who minted';
COMMENT ON COLUMN public.minted_certificates.wallet_address IS 'Wallet address that received the NFT';
COMMENT ON COLUMN public.minted_certificates.tx_hash IS 'Transaction hash of the mint';
COMMENT ON COLUMN public.minted_certificates.chain_id IS 'Chain ID where the NFT was minted (e.g., 8453 for Base)';
COMMENT ON COLUMN public.minted_certificates.contract_address IS 'Address of the NFT contract';
COMMENT ON COLUMN public.minted_certificates.project_name IS 'Snapshot of project name at mint time';
COMMENT ON COLUMN public.minted_certificates.project_type IS 'Snapshot of project type at mint time';
