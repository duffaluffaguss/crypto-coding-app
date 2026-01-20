-- Learning Paths Seed Data
-- Inserts initial learning paths and their lesson associations

-- Insert Learning Paths
INSERT INTO public.learning_paths (id, name, slug, description, difficulty, estimated_hours, "order") VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Token Basics', 'token-basics', 'Master the fundamentals of blockchain tokens. Learn about ERC-20 tokens, token economics, and build your first cryptocurrency from scratch.', 'beginner', 8, 1),
  ('550e8400-e29b-41d4-a716-446655440002', 'NFT Creator', 'nft-creator', 'Dive into the world of Non-Fungible Tokens. Create, mint, and deploy NFT collections with metadata, rarity, and marketplace integration.', 'intermediate', 12, 2),
  ('550e8400-e29b-41d4-a716-446655440003', 'DeFi Developer', 'defi-developer', 'Build decentralized finance applications. Learn about liquidity pools, yield farming, automated market makers, and advanced DeFi protocols.', 'advanced', 20, 3),
  ('550e8400-e29b-41d4-a716-446655440004', 'Web3 Social', 'web3-social', 'Create decentralized social platforms. Implement user profiles, content sharing, governance tokens, and community features on the blockchain.', 'intermediate', 15, 4)
ON CONFLICT (id) DO NOTHING;

-- Helper function to get lesson IDs (these should match your existing lessons table)
-- Note: You'll need to update these lesson IDs to match your actual lesson data

-- Learning Path Items with actual lesson IDs
INSERT INTO public.learning_path_items (path_id, lesson_id, "order", is_required) VALUES
  -- Token Basics lessons (using token- lessons)
  ('550e8400-e29b-41d4-a716-446655440001', 'token-01-basics', 1, true),
  ('550e8400-e29b-41d4-a716-446655440001', 'token-02-supply', 2, true),
  ('550e8400-e29b-41d4-a716-446655440001', 'token-03-transfer', 3, true),
  ('550e8400-e29b-41d4-a716-446655440001', 'token-04-allowance', 4, true),
  ('550e8400-e29b-41d4-a716-446655440001', 'token-05-transferfrom', 5, true),
  ('550e8400-e29b-41d4-a716-446655440001', 'token-06-minting', 6, false),
  ('550e8400-e29b-41d4-a716-446655440001', 'token-07-burning', 7, false),
  ('550e8400-e29b-41d4-a716-446655440001', 'token-08-pausable', 8, false),
  
  -- NFT Creator lessons (using nft- lessons)
  ('550e8400-e29b-41d4-a716-446655440002', 'nft-01-basics', 1, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'nft-02-variables', 2, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'nft-03-constructor', 3, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'nft-04-structs', 4, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'nft-05-mappings', 5, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'nft-06-listing', 6, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'nft-07-purchasing', 7, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'nft-08-events', 8, false),
  ('550e8400-e29b-41d4-a716-446655440002', 'nft-09-marketplace', 9, false),
  
  -- DeFi Developer lessons (using dao- lessons as advanced governance)
  ('550e8400-e29b-41d4-a716-446655440003', 'dao-01-basics', 1, true),
  ('550e8400-e29b-41d4-a716-446655440003', 'dao-02-joining', 2, true),
  ('550e8400-e29b-41d4-a716-446655440003', 'dao-03-proposals', 3, true),
  ('550e8400-e29b-41d4-a716-446655440003', 'dao-04-voting', 4, true),
  ('550e8400-e29b-41d4-a716-446655440003', 'dao-05-quorum', 5, true),
  ('550e8400-e29b-41d4-a716-446655440003', 'token-06-minting', 6, false),
  ('550e8400-e29b-41d4-a716-446655440003', 'token-07-burning', 7, false),
  
  -- Web3 Social lessons (using social- lessons)
  ('550e8400-e29b-41d4-a716-446655440004', 'social-01-basics', 1, true),
  ('550e8400-e29b-41d4-a716-446655440004', 'social-02-profiles', 2, true),
  ('550e8400-e29b-41d4-a716-446655440004', 'social-03-posts', 3, true),
  ('550e8400-e29b-41d4-a716-446655440004', 'social-04-likes', 4, true),
  ('550e8400-e29b-41d4-a716-446655440004', 'social-05-tipping', 5, true),
  ('550e8400-e29b-41d4-a716-446655440004', 'social-06-following', 6, false),
  ('550e8400-e29b-41d4-a716-446655440004', 'social-07-feed', 7, false),
  ('550e8400-e29b-41d4-a716-446655440004', 'social-08-updates', 8, false)
ON CONFLICT (path_id, lesson_id) DO NOTHING;

-- Note: The lesson_id values above are placeholders. 
-- You'll need to replace them with actual lesson IDs from your lessons table.
-- To check your existing lessons, run:
-- SELECT id, title, project_type FROM public.lessons ORDER BY project_type, "order";

-- Example query to map project types to learning paths:
-- UPDATE learning_path_items 
-- SET lesson_id = (
--   SELECT id FROM lessons 
--   WHERE project_type = 'token' 
--   AND "order" = learning_path_items."order"
--   LIMIT 1
-- )
-- WHERE path_id = '550e8400-e29b-41d4-a716-446655440001';