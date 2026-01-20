-- Daily Challenges Feature
-- Create tables for daily coding challenges

-- Daily challenges table
CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  starter_code TEXT NOT NULL DEFAULT '',
  solution_hint TEXT,
  points INTEGER NOT NULL DEFAULT 10,
  challenge_date DATE NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'solidity',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenge completions table
CREATE TABLE IF NOT EXISTS challenge_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  code_submitted TEXT NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, challenge_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(challenge_date DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_completions_user ON challenge_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_completions_challenge ON challenge_completions(challenge_id);

-- RLS Policies
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_completions ENABLE ROW LEVEL SECURITY;

-- Everyone can view challenges
CREATE POLICY "Anyone can view daily challenges"
  ON daily_challenges FOR SELECT
  TO authenticated
  USING (true);

-- Users can view their own completions
CREATE POLICY "Users can view their own completions"
  ON challenge_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can view all completions (for leaderboard purposes)
CREATE POLICY "Users can view all completions for stats"
  ON challenge_completions FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own completions
CREATE POLICY "Users can submit challenge completions"
  ON challenge_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Seed with 7 sample challenges (one for each day of the week)
INSERT INTO daily_challenges (title, description, difficulty, starter_code, solution_hint, points, challenge_date, category)
VALUES
  (
    'Hello Blockchain',
    'Create a simple smart contract that stores and returns a greeting message. The contract should have a `greeting` state variable and a function `getGreeting()` that returns it.',
    'beginner',
    '// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract HelloBlockchain {
    // TODO: Add a public string variable called "greeting"
    
    constructor() {
        // TODO: Initialize greeting to "Hello, Blockchain!"
    }
    
    // TODO: Add a function getGreeting() that returns the greeting
}',
    'Use the "public" keyword on your state variable to automatically create a getter, or create a view function that returns the string.',
    10,
    CURRENT_DATE,
    'solidity'
  ),
  (
    'Simple Counter',
    'Build a counter contract with increment, decrement, and reset functions. Make sure the counter cannot go below zero!',
    'beginner',
    '// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Counter {
    uint256 private count;
    
    // TODO: Add increment() function
    
    // TODO: Add decrement() function (should not go below 0)
    
    // TODO: Add reset() function
    
    // TODO: Add getCount() view function
}',
    'Use require() to check if count > 0 before decrementing. Remember that uint256 cannot be negative!',
    15,
    CURRENT_DATE - INTERVAL '1 day',
    'solidity'
  ),
  (
    'Token Balance Tracker',
    'Create a contract that tracks token balances for multiple addresses. Implement deposit and withdraw functions with proper checks.',
    'intermediate',
    '// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract BalanceTracker {
    // TODO: Create a mapping from address to uint256 for balances
    
    // TODO: Add deposit() function (payable)
    
    // TODO: Add withdraw(uint256 amount) function
    
    // TODO: Add getBalance(address user) view function
    
    // Bonus: Add events for deposits and withdrawals
}',
    'Use msg.value for deposits and address(this).balance to check contract balance. Don''t forget to update the mapping!',
    25,
    CURRENT_DATE - INTERVAL '2 days',
    'solidity'
  ),
  (
    'Simple Voting',
    'Build a basic voting contract where users can vote for one of three options. Each address can only vote once.',
    'intermediate',
    '// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleVoting {
    // TODO: Track vote counts for options 1, 2, and 3
    
    // TODO: Track which addresses have voted
    
    // TODO: Add vote(uint8 option) function (1, 2, or 3)
    
    // TODO: Add getVotes(uint8 option) view function
    
    // TODO: Add hasVoted(address voter) view function
}',
    'Use a mapping(address => bool) to track who has voted. Use require() to ensure valid option and that user hasn''t voted.',
    30,
    CURRENT_DATE - INTERVAL '3 days',
    'solidity'
  ),
  (
    'Ownable Contract',
    'Implement the Ownable pattern with ownership transfer capability. Only the owner should be able to call certain functions.',
    'intermediate',
    '// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Ownable {
    // TODO: Add owner state variable
    
    // TODO: Add onlyOwner modifier
    
    constructor() {
        // TODO: Set deployer as owner
    }
    
    // TODO: Add transferOwnership(address newOwner) function
    
    // TODO: Add renounceOwnership() function
    
    // TODO: Add getOwner() view function
}',
    'Store msg.sender in constructor. The modifier should use require(msg.sender == owner). Remember to emit events!',
    25,
    CURRENT_DATE - INTERVAL '4 days',
    'solidity'
  ),
  (
    'Time-Locked Savings',
    'Create a savings contract where users can deposit ETH that is locked until a specified time. Implement deposit with lock duration and withdraw after lock expires.',
    'advanced',
    '// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TimeLocked {
    struct Deposit {
        uint256 amount;
        uint256 unlockTime;
    }
    
    // TODO: Create mapping for user deposits
    
    // TODO: Add deposit(uint256 lockDuration) payable function
    
    // TODO: Add withdraw() function (check if time has passed)
    
    // TODO: Add getDeposit(address user) view function
    
    // TODO: Add timeUntilUnlock(address user) view function
}',
    'Use block.timestamp for time checks. unlockTime = block.timestamp + lockDuration. Check require(block.timestamp >= unlockTime) before withdraw.',
    40,
    CURRENT_DATE - INTERVAL '5 days',
    'solidity'
  ),
  (
    'Mini Token (ERC20-lite)',
    'Build a simplified ERC20-like token with transfer, balanceOf, and a mint function for the owner. This is your first step toward understanding token standards!',
    'advanced',
    '// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MiniToken {
    string public name = "MiniToken";
    string public symbol = "MINI";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    address public owner;
    
    // TODO: Add balances mapping
    
    // TODO: Add Transfer event
    
    constructor(uint256 initialSupply) {
        // TODO: Set owner and mint initial supply to owner
    }
    
    // TODO: Add balanceOf(address account) view function
    
    // TODO: Add transfer(address to, uint256 amount) function
    
    // TODO: Add mint(address to, uint256 amount) onlyOwner function
}',
    'Remember to check balances before transfer with require(). Update both sender and receiver balances. Emit Transfer event!',
    50,
    CURRENT_DATE - INTERVAL '6 days',
    'solidity'
  )
ON CONFLICT (challenge_date) DO NOTHING;

-- Function to get today's challenge
CREATE OR REPLACE FUNCTION get_todays_challenge()
RETURNS SETOF daily_challenges
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM daily_challenges 
  WHERE challenge_date = CURRENT_DATE
  LIMIT 1;
$$;

-- Function to get user's challenge stats
CREATE OR REPLACE FUNCTION get_user_challenge_stats(user_uuid UUID)
RETURNS TABLE (
  total_completed BIGINT,
  total_points BIGINT,
  current_streak INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  streak INTEGER := 0;
  check_date DATE := CURRENT_DATE;
BEGIN
  -- Get totals
  SELECT 
    COUNT(*),
    COALESCE(SUM(points_earned), 0)
  INTO total_completed, total_points
  FROM challenge_completions
  WHERE challenge_completions.user_id = user_uuid;
  
  -- Calculate streak (consecutive days with completions)
  WHILE EXISTS (
    SELECT 1 FROM challenge_completions cc
    JOIN daily_challenges dc ON dc.id = cc.challenge_id
    WHERE cc.user_id = user_uuid AND dc.challenge_date = check_date
  ) LOOP
    streak := streak + 1;
    check_date := check_date - INTERVAL '1 day';
  END LOOP;
  
  current_streak := streak;
  
  RETURN NEXT;
END;
$$;
