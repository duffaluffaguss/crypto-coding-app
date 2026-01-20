export type TemplateCategory = 'Token' | 'NFT' | 'DAO' | 'DeFi' | 'Gaming' | 'Utility';
export type TemplateDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  difficulty: TemplateDifficulty;
  icon: string;
  code: string;
  features: string[];
}

export const contractTemplates: ContractTemplate[] = [
  {
    id: 'erc20-token',
    name: 'Simple ERC-20 Token',
    description: 'Create your own fungible token with customizable name, symbol, and supply. Perfect for utility tokens, governance tokens, or reward systems.',
    category: 'Token',
    difficulty: 'Beginner',
    icon: '🪙',
    features: ['Mintable', 'Burnable', 'Pausable', 'Access Control'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}`
  },
  {
    id: 'nft-collection',
    name: 'NFT Collection (ERC-721)',
    description: 'Launch your own NFT collection with metadata, minting limits, and royalties. Great for digital art, collectibles, or membership passes.',
    category: 'NFT',
    difficulty: 'Beginner',
    icon: '🖼️',
    features: ['Metadata URI', 'Max Supply', 'Minting Price', 'Royalties'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFTCollection is ERC721, ERC721URIStorage, ERC721Royalty, Ownable {
    uint256 private _nextTokenId;
    uint256 public maxSupply;
    uint256 public mintPrice;
    string public baseURI;

    constructor(
        string memory name,
        string memory symbol,
        uint256 _maxSupply,
        uint256 _mintPrice,
        string memory _baseURI
    ) ERC721(name, symbol) Ownable(msg.sender) {
        maxSupply = _maxSupply;
        mintPrice = _mintPrice;
        baseURI = _baseURI;
        _setDefaultRoyalty(msg.sender, 250); // 2.5% royalty
    }

    function mint() public payable {
        require(_nextTokenId < maxSupply, "Max supply reached");
        require(msg.value >= mintPrice, "Insufficient payment");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked(baseURI, "/", Strings.toString(tokenId), ".json")));
    }

    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, ERC721Royalty) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}`
  },
  {
    id: 'dao-voting',
    name: 'Simple DAO Voting',
    description: 'Create a decentralized governance system where token holders can propose and vote on changes. Essential for community-driven projects.',
    category: 'DAO',
    difficulty: 'Intermediate',
    icon: '🗳️',
    features: ['Proposal Creation', 'Weighted Voting', 'Time-locked Execution', 'Quorum'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SimpleDAO is Ownable {
    IERC20 public governanceToken;
    
    struct Proposal {
        uint256 id;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 deadline;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    uint256 public proposalCount;
    uint256 public votingPeriod = 3 days;
    uint256 public quorumPercentage = 10; // 10% of total supply

    mapping(uint256 => Proposal) public proposals;

    event ProposalCreated(uint256 indexed id, string description, uint256 deadline);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed id);

    constructor(address _governanceToken) Ownable(msg.sender) {
        governanceToken = IERC20(_governanceToken);
    }

    function createProposal(string memory description) external returns (uint256) {
        require(governanceToken.balanceOf(msg.sender) > 0, "Must hold tokens to propose");
        
        proposalCount++;
        Proposal storage proposal = proposals[proposalCount];
        proposal.id = proposalCount;
        proposal.description = description;
        proposal.deadline = block.timestamp + votingPeriod;

        emit ProposalCreated(proposalCount, description, proposal.deadline);
        return proposalCount;
    }

    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp < proposal.deadline, "Voting ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");

        uint256 weight = governanceToken.balanceOf(msg.sender);
        require(weight > 0, "No voting power");

        proposal.hasVoted[msg.sender] = true;

        if (support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }

        emit Voted(proposalId, msg.sender, support, weight);
    }

    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.deadline, "Voting not ended");
        require(!proposal.executed, "Already executed");
        require(proposal.forVotes > proposal.againstVotes, "Proposal rejected");

        uint256 quorum = (governanceToken.totalSupply() * quorumPercentage) / 100;
        require(proposal.forVotes + proposal.againstVotes >= quorum, "Quorum not reached");

        proposal.executed = true;
        emit ProposalExecuted(proposalId);
    }
}`
  },
  {
    id: 'crowdfunding',
    name: 'Crowdfunding Campaign',
    description: 'Create a decentralized fundraising platform with goal targets, deadlines, and automatic refunds if goals aren\'t met.',
    category: 'DeFi',
    difficulty: 'Intermediate',
    icon: '💰',
    features: ['Funding Goal', 'Deadline', 'Auto Refund', 'Milestone Releases'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Crowdfunding is Ownable, ReentrancyGuard {
    struct Campaign {
        address creator;
        uint256 goal;
        uint256 pledged;
        uint256 deadline;
        bool claimed;
    }

    uint256 public campaignCount;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public pledges;

    event CampaignCreated(uint256 indexed id, address creator, uint256 goal, uint256 deadline);
    event Pledged(uint256 indexed id, address indexed pledger, uint256 amount);
    event Unpledged(uint256 indexed id, address indexed pledger, uint256 amount);
    event Claimed(uint256 indexed id, uint256 amount);
    event Refunded(uint256 indexed id, address indexed pledger, uint256 amount);

    constructor() Ownable(msg.sender) {}

    function createCampaign(uint256 goal, uint256 durationDays) external returns (uint256) {
        require(goal > 0, "Goal must be > 0");
        require(durationDays > 0 && durationDays <= 90, "Duration 1-90 days");

        campaignCount++;
        campaigns[campaignCount] = Campaign({
            creator: msg.sender,
            goal: goal,
            pledged: 0,
            deadline: block.timestamp + (durationDays * 1 days),
            claimed: false
        });

        emit CampaignCreated(campaignCount, msg.sender, goal, campaigns[campaignCount].deadline);
        return campaignCount;
    }

    function pledge(uint256 campaignId) external payable nonReentrant {
        Campaign storage campaign = campaigns[campaignId];
        require(block.timestamp < campaign.deadline, "Campaign ended");
        require(msg.value > 0, "Must pledge > 0");

        campaign.pledged += msg.value;
        pledges[campaignId][msg.sender] += msg.value;

        emit Pledged(campaignId, msg.sender, msg.value);
    }

    function unpledge(uint256 campaignId, uint256 amount) external nonReentrant {
        Campaign storage campaign = campaigns[campaignId];
        require(block.timestamp < campaign.deadline, "Campaign ended");
        require(pledges[campaignId][msg.sender] >= amount, "Insufficient pledge");

        campaign.pledged -= amount;
        pledges[campaignId][msg.sender] -= amount;
        payable(msg.sender).transfer(amount);

        emit Unpledged(campaignId, msg.sender, amount);
    }

    function claim(uint256 campaignId) external nonReentrant {
        Campaign storage campaign = campaigns[campaignId];
        require(msg.sender == campaign.creator, "Not creator");
        require(block.timestamp >= campaign.deadline, "Campaign not ended");
        require(campaign.pledged >= campaign.goal, "Goal not reached");
        require(!campaign.claimed, "Already claimed");

        campaign.claimed = true;
        payable(campaign.creator).transfer(campaign.pledged);

        emit Claimed(campaignId, campaign.pledged);
    }

    function refund(uint256 campaignId) external nonReentrant {
        Campaign storage campaign = campaigns[campaignId];
        require(block.timestamp >= campaign.deadline, "Campaign not ended");
        require(campaign.pledged < campaign.goal, "Goal reached");

        uint256 amount = pledges[campaignId][msg.sender];
        require(amount > 0, "No pledge");

        pledges[campaignId][msg.sender] = 0;
        payable(msg.sender).transfer(amount);

        emit Refunded(campaignId, msg.sender, amount);
    }
}`
  },
  {
    id: 'escrow',
    name: 'Escrow Contract',
    description: 'Secure peer-to-peer transactions with a trusted arbiter. Perfect for freelance payments, trades, or any transaction requiring trust.',
    category: 'Utility',
    difficulty: 'Intermediate',
    icon: '🔐',
    features: ['Buyer/Seller Protection', 'Arbiter Resolution', 'Deadline', 'Dispute Handling'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Escrow is ReentrancyGuard {
    enum State { Created, Funded, Released, Refunded, Disputed }

    struct Deal {
        address buyer;
        address seller;
        address arbiter;
        uint256 amount;
        uint256 deadline;
        State state;
    }

    uint256 public dealCount;
    uint256 public arbiterFeePercent = 1; // 1% arbiter fee
    
    mapping(uint256 => Deal) public deals;

    event DealCreated(uint256 indexed id, address buyer, address seller, address arbiter, uint256 amount);
    event DealFunded(uint256 indexed id);
    event DealReleased(uint256 indexed id);
    event DealRefunded(uint256 indexed id);
    event DealDisputed(uint256 indexed id);

    function createDeal(address seller, address arbiter, uint256 durationDays) external payable returns (uint256) {
        require(msg.value > 0, "Must send funds");
        require(seller != address(0) && arbiter != address(0), "Invalid addresses");
        require(seller != msg.sender, "Seller cannot be buyer");

        dealCount++;
        deals[dealCount] = Deal({
            buyer: msg.sender,
            seller: seller,
            arbiter: arbiter,
            amount: msg.value,
            deadline: block.timestamp + (durationDays * 1 days),
            state: State.Funded
        });

        emit DealCreated(dealCount, msg.sender, seller, arbiter, msg.value);
        emit DealFunded(dealCount);
        return dealCount;
    }

    function release(uint256 dealId) external nonReentrant {
        Deal storage deal = deals[dealId];
        require(deal.state == State.Funded, "Invalid state");
        require(msg.sender == deal.buyer, "Only buyer can release");

        deal.state = State.Released;
        payable(deal.seller).transfer(deal.amount);

        emit DealReleased(dealId);
    }

    function refund(uint256 dealId) external nonReentrant {
        Deal storage deal = deals[dealId];
        require(deal.state == State.Funded, "Invalid state");
        require(msg.sender == deal.seller, "Only seller can refund");

        deal.state = State.Refunded;
        payable(deal.buyer).transfer(deal.amount);

        emit DealRefunded(dealId);
    }

    function dispute(uint256 dealId) external {
        Deal storage deal = deals[dealId];
        require(deal.state == State.Funded, "Invalid state");
        require(msg.sender == deal.buyer || msg.sender == deal.seller, "Not party to deal");

        deal.state = State.Disputed;
        emit DealDisputed(dealId);
    }

    function resolveDispute(uint256 dealId, bool releaseToBuyer) external nonReentrant {
        Deal storage deal = deals[dealId];
        require(deal.state == State.Disputed, "Not disputed");
        require(msg.sender == deal.arbiter, "Only arbiter can resolve");

        uint256 arbiterFee = (deal.amount * arbiterFeePercent) / 100;
        uint256 payout = deal.amount - arbiterFee;

        if (releaseToBuyer) {
            deal.state = State.Refunded;
            payable(deal.buyer).transfer(payout);
        } else {
            deal.state = State.Released;
            payable(deal.seller).transfer(payout);
        }
        
        payable(deal.arbiter).transfer(arbiterFee);
    }
}`
  },
  {
    id: 'lottery',
    name: 'Lottery Contract',
    description: 'Create a fair, transparent lottery where participants can buy tickets and a random winner is selected using Chainlink VRF.',
    category: 'Gaming',
    difficulty: 'Advanced',
    icon: '🎰',
    features: ['Ticket Purchase', 'Random Selection', 'Prize Pool', 'Auto Reset'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Lottery is Ownable, ReentrancyGuard {
    address[] public players;
    uint256 public ticketPrice;
    uint256 public lotteryId;
    uint256 public maxPlayers;
    
    mapping(uint256 => address) public lotteryHistory;

    event TicketPurchased(address indexed player, uint256 indexed lotteryId);
    event WinnerPicked(address indexed winner, uint256 indexed lotteryId, uint256 prize);

    constructor(uint256 _ticketPrice, uint256 _maxPlayers) Ownable(msg.sender) {
        ticketPrice = _ticketPrice;
        maxPlayers = _maxPlayers;
        lotteryId = 1;
    }

    function buyTicket() external payable nonReentrant {
        require(msg.value == ticketPrice, "Incorrect ticket price");
        require(players.length < maxPlayers, "Lottery is full");
        
        // Check if player already has a ticket
        for (uint256 i = 0; i < players.length; i++) {
            require(players[i] != msg.sender, "Already have a ticket");
        }

        players.push(msg.sender);
        emit TicketPurchased(msg.sender, lotteryId);

        // Auto-pick winner when max players reached
        if (players.length == maxPlayers) {
            pickWinner();
        }
    }

    function pickWinner() public onlyOwner nonReentrant {
        require(players.length > 0, "No players");

        // Simple randomness (for production, use Chainlink VRF)
        uint256 randomIndex = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    players.length
                )
            )
        ) % players.length;

        address winner = players[randomIndex];
        uint256 prize = address(this).balance;

        lotteryHistory[lotteryId] = winner;
        
        // Reset for next lottery
        delete players;
        lotteryId++;

        // Transfer prize
        (bool success, ) = payable(winner).call{value: prize}("");
        require(success, "Transfer failed");

        emit WinnerPicked(winner, lotteryId - 1, prize);
    }

    function getPlayers() external view returns (address[] memory) {
        return players;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function setTicketPrice(uint256 _ticketPrice) external onlyOwner {
        require(players.length == 0, "Lottery in progress");
        ticketPrice = _ticketPrice;
    }
}`
  },
  {
    id: 'staking',
    name: 'Staking Contract',
    description: 'Allow users to stake tokens and earn rewards over time. Configurable APY and lock periods for flexible tokenomics.',
    category: 'DeFi',
    difficulty: 'Advanced',
    icon: '📈',
    features: ['Flexible Staking', 'Reward Calculation', 'Lock Periods', 'Compound Interest'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Staking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public stakingToken;
    IERC20 public rewardToken;

    uint256 public rewardRate = 100; // Reward tokens per second
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    uint256 public totalStaked;

    mapping(address => uint256) public userStakedBalance;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);

    constructor(address _stakingToken, address _rewardToken) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored + 
            (((block.timestamp - lastUpdateTime) * rewardRate * 1e18) / totalStaked);
    }

    function earned(address account) public view returns (uint256) {
        return (
            (userStakedBalance[account] * (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18
        ) + rewards[account];
    }

    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        
        totalStaked += amount;
        userStakedBalance[msg.sender] += amount;
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        require(userStakedBalance[msg.sender] >= amount, "Insufficient balance");
        
        totalStaked -= amount;
        userStakedBalance[msg.sender] -= amount;
        stakingToken.safeTransfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, amount);
    }

    function claimReward() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No rewards to claim");
        
        rewards[msg.sender] = 0;
        rewardToken.safeTransfer(msg.sender, reward);
        
        emit RewardPaid(msg.sender, reward);
    }

    function setRewardRate(uint256 _rewardRate) external onlyOwner updateReward(address(0)) {
        rewardRate = _rewardRate;
    }
}`
  },
  {
    id: 'airdrop',
    name: 'Airdrop Contract',
    description: 'Distribute tokens to multiple addresses efficiently using Merkle proofs. Perfect for token launches, rewards, or community distributions.',
    category: 'Utility',
    difficulty: 'Intermediate',
    icon: '🪂',
    features: ['Merkle Proof Verification', 'Gas Efficient', 'Claim Tracking', 'Deadline'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MerkleAirdrop is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public token;
    bytes32 public merkleRoot;
    uint256 public claimDeadline;

    mapping(address => bool) public hasClaimed;

    event Claimed(address indexed account, uint256 amount);
    event MerkleRootUpdated(bytes32 newRoot);
    event DeadlineExtended(uint256 newDeadline);
    event TokensWithdrawn(uint256 amount);

    constructor(
        address _token,
        bytes32 _merkleRoot,
        uint256 _durationDays
    ) Ownable(msg.sender) {
        token = IERC20(_token);
        merkleRoot = _merkleRoot;
        claimDeadline = block.timestamp + (_durationDays * 1 days);
    }

    function claim(uint256 amount, bytes32[] calldata merkleProof) external {
        require(block.timestamp < claimDeadline, "Airdrop ended");
        require(!hasClaimed[msg.sender], "Already claimed");

        // Verify the merkle proof
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender, amount))));
        require(MerkleProof.verify(merkleProof, merkleRoot, leaf), "Invalid proof");

        hasClaimed[msg.sender] = true;
        token.safeTransfer(msg.sender, amount);

        emit Claimed(msg.sender, amount);
    }

    function updateMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
        emit MerkleRootUpdated(_merkleRoot);
    }

    function extendDeadline(uint256 additionalDays) external onlyOwner {
        claimDeadline += additionalDays * 1 days;
        emit DeadlineExtended(claimDeadline);
    }

    function withdrawRemainingTokens() external onlyOwner {
        require(block.timestamp >= claimDeadline, "Airdrop not ended");
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        
        token.safeTransfer(owner(), balance);
        emit TokensWithdrawn(balance);
    }

    function isEligible(
        address account,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external view returns (bool) {
        if (hasClaimed[account]) return false;
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(account, amount))));
        return MerkleProof.verify(merkleProof, merkleRoot, leaf);
    }
}`
  },
  {
    id: 'multisig-wallet',
    name: 'Multi-Signature Wallet',
    description: 'A secure wallet requiring multiple approvals for transactions. Essential for DAOs, team treasuries, or high-security fund management.',
    category: 'Utility',
    difficulty: 'Advanced',
    icon: '🔑',
    features: ['Multiple Owners', 'Threshold Approval', 'Transaction Queue', 'Revocation'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MultiSigWallet {
    event Deposit(address indexed sender, uint256 amount);
    event Submit(uint256 indexed txId);
    event Approve(address indexed owner, uint256 indexed txId);
    event Revoke(address indexed owner, uint256 indexed txId);
    event Execute(uint256 indexed txId);

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 approvalCount;
    }

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public required;

    Transaction[] public transactions;
    mapping(uint256 => mapping(address => bool)) public approved;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not owner");
        _;
    }

    modifier txExists(uint256 txId) {
        require(txId < transactions.length, "Tx does not exist");
        _;
    }

    modifier notApproved(uint256 txId) {
        require(!approved[txId][msg.sender], "Already approved");
        _;
    }

    modifier notExecuted(uint256 txId) {
        require(!transactions[txId].executed, "Already executed");
        _;
    }

    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length > 0, "Owners required");
        require(_required > 0 && _required <= _owners.length, "Invalid required");

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Duplicate owner");

            isOwner[owner] = true;
            owners.push(owner);
        }

        required = _required;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function submit(address to, uint256 value, bytes calldata data) external onlyOwner returns (uint256) {
        uint256 txId = transactions.length;
        transactions.push(Transaction({
            to: to,
            value: value,
            data: data,
            executed: false,
            approvalCount: 0
        }));
        emit Submit(txId);
        return txId;
    }

    function approve(uint256 txId) external onlyOwner txExists(txId) notApproved(txId) notExecuted(txId) {
        approved[txId][msg.sender] = true;
        transactions[txId].approvalCount++;
        emit Approve(msg.sender, txId);
    }

    function execute(uint256 txId) external onlyOwner txExists(txId) notExecuted(txId) {
        Transaction storage transaction = transactions[txId];
        require(transaction.approvalCount >= required, "Not enough approvals");

        transaction.executed = true;
        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "Tx failed");

        emit Execute(txId);
    }

    function revoke(uint256 txId) external onlyOwner txExists(txId) notExecuted(txId) {
        require(approved[txId][msg.sender], "Not approved");
        approved[txId][msg.sender] = false;
        transactions[txId].approvalCount--;
        emit Revoke(msg.sender, txId);
    }

    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    function getTransactionCount() external view returns (uint256) {
        return transactions.length;
    }
}`
  },
  {
    id: 'nft-marketplace',
    name: 'NFT Marketplace',
    description: 'A decentralized marketplace for buying and selling NFTs with listing, offers, and royalty support.',
    category: 'NFT',
    difficulty: 'Advanced',
    icon: '🏪',
    features: ['List NFTs', 'Buy/Sell', 'Offers', 'Platform Fee'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NFTMarketplace is Ownable, ReentrancyGuard {
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool active;
    }

    uint256 public listingCount;
    uint256 public platformFeePercent = 25; // 2.5% (in basis points / 10)
    
    mapping(uint256 => Listing) public listings;
    mapping(address => mapping(uint256 => uint256)) public nftToListingId;

    event Listed(uint256 indexed listingId, address indexed seller, address nftContract, uint256 tokenId, uint256 price);
    event Sale(uint256 indexed listingId, address indexed buyer, uint256 price);
    event Cancelled(uint256 indexed listingId);
    event PriceUpdated(uint256 indexed listingId, uint256 newPrice);

    constructor() Ownable(msg.sender) {}

    function list(address nftContract, uint256 tokenId, uint256 price) external nonReentrant returns (uint256) {
        require(price > 0, "Price must be > 0");
        
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not owner");
        require(
            nft.getApproved(tokenId) == address(this) || 
            nft.isApprovedForAll(msg.sender, address(this)),
            "Not approved"
        );

        listingCount++;
        listings[listingCount] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            active: true
        });
        
        nftToListingId[nftContract][tokenId] = listingCount;

        emit Listed(listingCount, msg.sender, nftContract, tokenId, price);
        return listingCount;
    }

    function buy(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Not active");
        require(msg.value >= listing.price, "Insufficient payment");

        listing.active = false;

        uint256 platformFee = (listing.price * platformFeePercent) / 1000;
        uint256 sellerProceeds = listing.price - platformFee;

        IERC721(listing.nftContract).safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId
        );

        payable(listing.seller).transfer(sellerProceeds);
        
        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }

        emit Sale(listingId, msg.sender, listing.price);
    }

    function cancel(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Not active");
        require(listing.seller == msg.sender, "Not seller");

        listing.active = false;
        emit Cancelled(listingId);
    }

    function updatePrice(uint256 listingId, uint256 newPrice) external {
        Listing storage listing = listings[listingId];
        require(listing.active, "Not active");
        require(listing.seller == msg.sender, "Not seller");
        require(newPrice > 0, "Price must be > 0");

        listing.price = newPrice;
        emit PriceUpdated(listingId, newPrice);
    }

    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function setPlatformFee(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 100, "Max 10%"); // Max 10% fee
        platformFeePercent = _feePercent;
    }
}`
  },
  {
    id: 'vesting',
    name: 'Token Vesting',
    description: 'Lock tokens and release them gradually over time. Perfect for team allocations, investor lockups, or scheduled token distributions.',
    category: 'DeFi',
    difficulty: 'Intermediate',
    icon: '⏳',
    features: ['Linear Vesting', 'Cliff Period', 'Revocable', 'Multiple Beneficiaries'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TokenVesting is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct VestingSchedule {
        address beneficiary;
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 vestingDuration;
        bool revocable;
        bool revoked;
    }

    IERC20 public token;
    uint256 public vestingScheduleCount;
    
    mapping(uint256 => VestingSchedule) public vestingSchedules;
    mapping(address => uint256[]) public beneficiarySchedules;

    event VestingCreated(uint256 indexed scheduleId, address indexed beneficiary, uint256 amount);
    event TokensReleased(uint256 indexed scheduleId, address indexed beneficiary, uint256 amount);
    event VestingRevoked(uint256 indexed scheduleId, uint256 refundAmount);

    constructor(address _token) Ownable(msg.sender) {
        token = IERC20(_token);
    }

    function createVestingSchedule(
        address beneficiary,
        uint256 amount,
        uint256 cliffDays,
        uint256 vestingDays,
        bool revocable
    ) external onlyOwner returns (uint256) {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(amount > 0, "Amount must be > 0");
        require(vestingDays > 0, "Vesting duration must be > 0");
        require(cliffDays <= vestingDays, "Cliff > vesting duration");

        token.safeTransferFrom(msg.sender, address(this), amount);

        vestingScheduleCount++;
        vestingSchedules[vestingScheduleCount] = VestingSchedule({
            beneficiary: beneficiary,
            totalAmount: amount,
            releasedAmount: 0,
            startTime: block.timestamp,
            cliffDuration: cliffDays * 1 days,
            vestingDuration: vestingDays * 1 days,
            revocable: revocable,
            revoked: false
        });

        beneficiarySchedules[beneficiary].push(vestingScheduleCount);

        emit VestingCreated(vestingScheduleCount, beneficiary, amount);
        return vestingScheduleCount;
    }

    function release(uint256 scheduleId) external nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[scheduleId];
        require(schedule.beneficiary == msg.sender, "Not beneficiary");
        require(!schedule.revoked, "Schedule revoked");

        uint256 releasable = _computeReleasable(schedule);
        require(releasable > 0, "No tokens to release");

        schedule.releasedAmount += releasable;
        token.safeTransfer(schedule.beneficiary, releasable);

        emit TokensReleased(scheduleId, schedule.beneficiary, releasable);
    }

    function revoke(uint256 scheduleId) external onlyOwner nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[scheduleId];
        require(schedule.revocable, "Not revocable");
        require(!schedule.revoked, "Already revoked");

        uint256 releasable = _computeReleasable(schedule);
        uint256 refund = schedule.totalAmount - schedule.releasedAmount - releasable;

        schedule.revoked = true;

        if (releasable > 0) {
            schedule.releasedAmount += releasable;
            token.safeTransfer(schedule.beneficiary, releasable);
        }

        if (refund > 0) {
            token.safeTransfer(owner(), refund);
        }

        emit VestingRevoked(scheduleId, refund);
    }

    function _computeReleasable(VestingSchedule memory schedule) internal view returns (uint256) {
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            return 0;
        }

        uint256 elapsed = block.timestamp - schedule.startTime;
        uint256 vested;

        if (elapsed >= schedule.vestingDuration) {
            vested = schedule.totalAmount;
        } else {
            vested = (schedule.totalAmount * elapsed) / schedule.vestingDuration;
        }

        return vested - schedule.releasedAmount;
    }

    function getReleasable(uint256 scheduleId) external view returns (uint256) {
        return _computeReleasable(vestingSchedules[scheduleId]);
    }

    function getBeneficiarySchedules(address beneficiary) external view returns (uint256[] memory) {
        return beneficiarySchedules[beneficiary];
    }
}`
  },
  {
    id: 'simple-swap',
    name: 'Simple Token Swap',
    description: 'A basic decentralized exchange for swapping between two ERC-20 tokens using a constant product formula (x*y=k). Great for learning AMM mechanics.',
    category: 'DeFi',
    difficulty: 'Advanced',
    icon: '🔄',
    features: ['Liquidity Pools', 'Constant Product AMM', 'LP Tokens', 'Swap Fee'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SimpleSwap is ERC20, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public tokenA;
    IERC20 public tokenB;
    
    uint256 public reserveA;
    uint256 public reserveB;
    uint256 public constant FEE_PERCENT = 3; // 0.3% fee (3/1000)

    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB, uint256 lpTokens);
    event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountB, uint256 lpTokens);
    event Swap(address indexed user, address tokenIn, uint256 amountIn, uint256 amountOut);

    constructor(
        address _tokenA,
        address _tokenB,
        string memory lpName,
        string memory lpSymbol
    ) ERC20(lpName, lpSymbol) {
        require(_tokenA != _tokenB, "Identical tokens");
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    function addLiquidity(uint256 amountA, uint256 amountB) external nonReentrant returns (uint256 lpTokens) {
        require(amountA > 0 && amountB > 0, "Amounts must be > 0");

        if (totalSupply() == 0) {
            // First liquidity provider sets the ratio
            lpTokens = sqrt(amountA * amountB);
        } else {
            // Subsequent providers must match the ratio
            uint256 lpFromA = (amountA * totalSupply()) / reserveA;
            uint256 lpFromB = (amountB * totalSupply()) / reserveB;
            lpTokens = lpFromA < lpFromB ? lpFromA : lpFromB;
        }

        require(lpTokens > 0, "Insufficient liquidity minted");

        tokenA.safeTransferFrom(msg.sender, address(this), amountA);
        tokenB.safeTransferFrom(msg.sender, address(this), amountB);

        reserveA += amountA;
        reserveB += amountB;

        _mint(msg.sender, lpTokens);
        emit LiquidityAdded(msg.sender, amountA, amountB, lpTokens);
    }

    function removeLiquidity(uint256 lpTokens) external nonReentrant returns (uint256 amountA, uint256 amountB) {
        require(lpTokens > 0, "LP tokens must be > 0");
        require(balanceOf(msg.sender) >= lpTokens, "Insufficient LP tokens");

        amountA = (lpTokens * reserveA) / totalSupply();
        amountB = (lpTokens * reserveB) / totalSupply();

        require(amountA > 0 && amountB > 0, "Insufficient liquidity burned");

        _burn(msg.sender, lpTokens);

        reserveA -= amountA;
        reserveB -= amountB;

        tokenA.safeTransfer(msg.sender, amountA);
        tokenB.safeTransfer(msg.sender, amountB);

        emit LiquidityRemoved(msg.sender, amountA, amountB, lpTokens);
    }

    function swapAForB(uint256 amountIn) external nonReentrant returns (uint256 amountOut) {
        require(amountIn > 0, "Amount must be > 0");
        amountOut = getAmountOut(amountIn, reserveA, reserveB);
        require(amountOut > 0, "Insufficient output");

        tokenA.safeTransferFrom(msg.sender, address(this), amountIn);
        tokenB.safeTransfer(msg.sender, amountOut);

        reserveA += amountIn;
        reserveB -= amountOut;

        emit Swap(msg.sender, address(tokenA), amountIn, amountOut);
    }

    function swapBForA(uint256 amountIn) external nonReentrant returns (uint256 amountOut) {
        require(amountIn > 0, "Amount must be > 0");
        amountOut = getAmountOut(amountIn, reserveB, reserveA);
        require(amountOut > 0, "Insufficient output");

        tokenB.safeTransferFrom(msg.sender, address(this), amountIn);
        tokenA.safeTransfer(msg.sender, amountOut);

        reserveB += amountIn;
        reserveA -= amountOut;

        emit Swap(msg.sender, address(tokenB), amountIn, amountOut);
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256) {
        require(amountIn > 0 && reserveIn > 0 && reserveOut > 0, "Invalid reserves");
        
        uint256 amountInWithFee = amountIn * (1000 - FEE_PERCENT);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        
        return numerator / denominator;
    }

    function getReserves() external view returns (uint256, uint256) {
        return (reserveA, reserveB);
    }

    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}`
  },
  {
    id: 'timelock',
    name: 'Timelock Controller',
    description: 'Add time delays to contract operations for enhanced security. Essential for DAO governance and admin actions that require a waiting period.',
    category: 'Utility',
    difficulty: 'Intermediate',
    icon: '⏰',
    features: ['Scheduled Execution', 'Minimum Delay', 'Cancellation', 'Role-based Access'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Timelock is Ownable {
    uint256 public constant MIN_DELAY = 1 days;
    uint256 public constant MAX_DELAY = 30 days;
    uint256 public constant GRACE_PERIOD = 14 days;

    mapping(bytes32 => bool) public queuedTransactions;
    
    uint256 public delay;

    event TransactionQueued(
        bytes32 indexed txHash,
        address indexed target,
        uint256 value,
        bytes data,
        uint256 executeTime
    );
    event TransactionExecuted(
        bytes32 indexed txHash,
        address indexed target,
        uint256 value,
        bytes data
    );
    event TransactionCancelled(bytes32 indexed txHash);
    event DelayUpdated(uint256 oldDelay, uint256 newDelay);

    constructor(uint256 _delay) Ownable(msg.sender) {
        require(_delay >= MIN_DELAY && _delay <= MAX_DELAY, "Invalid delay");
        delay = _delay;
    }

    function queueTransaction(
        address target,
        uint256 value,
        bytes calldata data
    ) external onlyOwner returns (bytes32) {
        uint256 executeTime = block.timestamp + delay;
        bytes32 txHash = keccak256(abi.encode(target, value, data, executeTime));
        
        require(!queuedTransactions[txHash], "Already queued");
        queuedTransactions[txHash] = true;

        emit TransactionQueued(txHash, target, value, data, executeTime);
        return txHash;
    }

    function executeTransaction(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 executeTime
    ) external payable onlyOwner returns (bytes memory) {
        bytes32 txHash = keccak256(abi.encode(target, value, data, executeTime));
        
        require(queuedTransactions[txHash], "Not queued");
        require(block.timestamp >= executeTime, "Too early");
        require(block.timestamp <= executeTime + GRACE_PERIOD, "Tx expired");

        queuedTransactions[txHash] = false;

        (bool success, bytes memory result) = target.call{value: value}(data);
        require(success, "Tx failed");

        emit TransactionExecuted(txHash, target, value, data);
        return result;
    }

    function cancelTransaction(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 executeTime
    ) external onlyOwner {
        bytes32 txHash = keccak256(abi.encode(target, value, data, executeTime));
        
        require(queuedTransactions[txHash], "Not queued");
        queuedTransactions[txHash] = false;

        emit TransactionCancelled(txHash);
    }

    function setDelay(uint256 _delay) external {
        require(msg.sender == address(this), "Must be called via timelock");
        require(_delay >= MIN_DELAY && _delay <= MAX_DELAY, "Invalid delay");
        
        uint256 oldDelay = delay;
        delay = _delay;
        
        emit DelayUpdated(oldDelay, _delay);
    }

    function getTransactionHash(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 executeTime
    ) external pure returns (bytes32) {
        return keccak256(abi.encode(target, value, data, executeTime));
    }

    function isQueued(bytes32 txHash) external view returns (bool) {
        return queuedTransactions[txHash];
    }

    receive() external payable {}
}`
  }
];

export const templateCategories: TemplateCategory[] = ['Token', 'NFT', 'DAO', 'DeFi', 'Gaming', 'Utility'];

export function getTemplatesByCategory(category: TemplateCategory): ContractTemplate[] {
  return contractTemplates.filter(t => t.category === category);
}

export function getTemplateById(id: string): ContractTemplate | undefined {
  return contractTemplates.find(t => t.id === id);
}

export function getDifficultyColor(difficulty: TemplateDifficulty): string {
  switch (difficulty) {
    case 'Beginner':
      return 'bg-green-500/10 text-green-500';
    case 'Intermediate':
      return 'bg-yellow-500/10 text-yellow-500';
    case 'Advanced':
      return 'bg-red-500/10 text-red-500';
  }
}

export function getCategoryColor(category: TemplateCategory): string {
  switch (category) {
    case 'Token':
      return 'bg-blue-500/10 text-blue-500';
    case 'NFT':
      return 'bg-purple-500/10 text-purple-500';
    case 'DAO':
      return 'bg-indigo-500/10 text-indigo-500';
    case 'DeFi':
      return 'bg-emerald-500/10 text-emerald-500';
    case 'Gaming':
      return 'bg-orange-500/10 text-orange-500';
    case 'Utility':
      return 'bg-gray-500/10 text-gray-500';
  }
}
