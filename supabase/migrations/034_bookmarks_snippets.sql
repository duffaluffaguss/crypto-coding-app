-- Add support for bookmarking code snippets
-- Updates existing bookmarks table to include 'snippet' as a valid item type

-- Update the check constraint to include 'snippet'
ALTER TABLE bookmarks 
DROP CONSTRAINT IF EXISTS bookmarks_item_type_check;

ALTER TABLE bookmarks 
ADD CONSTRAINT bookmarks_item_type_check 
CHECK (item_type IN ('template', 'project', 'lesson', 'snippet'));

-- Update helper functions to work with snippets

-- Update is_bookmarked function (already handles all types)
-- No changes needed as it's generic

-- Update get_bookmark_count function (already handles all types)  
-- No changes needed as it's generic

-- Update get_user_bookmarks function (already handles all types)
-- No changes needed as it's generic

-- Add comment for clarity
COMMENT ON COLUMN bookmarks.item_type IS 'Type of item being bookmarked: template (contract template), project (user project), lesson (tutorial), snippet (code snippet)';