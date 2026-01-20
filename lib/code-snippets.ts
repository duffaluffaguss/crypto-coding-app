export interface CodeSnippet {
  id: string;
  name: string;
  description: string;
  category: 'basics' | 'tokens' | 'nft' | 'security' | 'patterns' | 'utils';
  code: string;
}

export const CODE_SNIPPETS: CodeSnippet[] = [
  // Basics
  {
    id: 'license-pragma',
    name: 'License & Pragma',
    description: 'Standard license and Solidity version',
    category: 'basics',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;`,
  },
  {
    id: 'basic-contract',
    name: 'Basic Contract',
    description: 'Simple contract structure',
    category: 'basics',
    code: `contract MyContract {
    // State variables
    address public owner;
    
    // Constructor
    constructor() {
        owner = msg.sender;
    }
    
    // Functions go here
}`,
  },
  {
    id: 'constructor',
    name: 'Constructor',
    description: 'Contract constructor function',
    category: 'basics',
    code: `constructor() {
    owner = msg.sender;
}`,
  },
  {
    id: 'event',
    name: 'Event Declaration',
    description: 'Declare and emit an event',
    category: 'basics',
    code: `event Transfer(address indexed from, address indexed to, uint256 value);

// Emit the event
emit Transfer(msg.sender, recipient, amount);`,
  },
  {
    id: 'modifier',
    name: 'Custom Modifier',
    description: 'Create a reusable modifier',
    category: 'basics',
    code: `modifier onlyOwner() {
    require(msg.sender == owner, "Not the owner");
    _;
}

function protectedFunction() external onlyOwner {
    // Only owner can call this
}`,
  },

  // Tokens
  {
    id: 'erc20-interface',
    name: 'ERC-20 Interface',
    description: 'Standard ERC-20 token interface',
    category: 'tokens',
    code: `interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}`,
  },
  {
    id: 'mint-function',
    name: 'Mint Function',
    description: 'Create new tokens',
    category: 'tokens',
    code: `function mint(address to, uint256 amount) external onlyOwner {
    require(to != address(0), "Cannot mint to zero address");
    _totalSupply += amount;
    _balances[to] += amount;
    emit Transfer(address(0), to, amount);
}`,
  },
  {
    id: 'burn-function',
    name: 'Burn Function',
    description: 'Destroy tokens',
    category: 'tokens',
    code: `function burn(uint256 amount) external {
    require(_balances[msg.sender] >= amount, "Insufficient balance");
    _balances[msg.sender] -= amount;
    _totalSupply -= amount;
    emit Transfer(msg.sender, address(0), amount);
}`,
  },

  // NFT
  {
    id: 'erc721-interface',
    name: 'ERC-721 Interface',
    description: 'Standard NFT interface',
    category: 'nft',
    code: `interface IERC721 {
    function balanceOf(address owner) external view returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function getApproved(uint256 tokenId) external view returns (address);
    function setApprovalForAll(address operator, bool approved) external;
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}`,
  },
  {
    id: 'nft-mint',
    name: 'NFT Mint Function',
    description: 'Mint a new NFT',
    category: 'nft',
    code: `function mint(address to, string memory tokenURI) external returns (uint256) {
    require(to != address(0), "Cannot mint to zero address");
    
    uint256 tokenId = _tokenIdCounter;
    _tokenIdCounter++;
    
    _owners[tokenId] = to;
    _balances[to]++;
    _tokenURIs[tokenId] = tokenURI;
    
    emit Transfer(address(0), to, tokenId);
    return tokenId;
}`,
  },

  // Security
  {
    id: 'reentrancy-guard',
    name: 'Reentrancy Guard',
    description: 'Prevent reentrancy attacks',
    category: 'security',
    code: `bool private _locked;

modifier nonReentrant() {
    require(!_locked, "Reentrant call");
    _locked = true;
    _;
    _locked = false;
}

function withdraw() external nonReentrant {
    uint256 balance = balances[msg.sender];
    require(balance > 0, "No balance");
    
    balances[msg.sender] = 0;
    (bool success, ) = msg.sender.call{value: balance}("");
    require(success, "Transfer failed");
}`,
  },
  {
    id: 'ownable',
    name: 'Ownable Pattern',
    description: 'Owner-only access control',
    category: 'security',
    code: `address public owner;

constructor() {
    owner = msg.sender;
}

modifier onlyOwner() {
    require(msg.sender == owner, "Not the owner");
    _;
}

function transferOwnership(address newOwner) external onlyOwner {
    require(newOwner != address(0), "Invalid address");
    owner = newOwner;
}`,
  },
  {
    id: 'pausable',
    name: 'Pausable Pattern',
    description: 'Emergency pause functionality',
    category: 'security',
    code: `bool public paused;

modifier whenNotPaused() {
    require(!paused, "Contract is paused");
    _;
}

function pause() external onlyOwner {
    paused = true;
}

function unpause() external onlyOwner {
    paused = false;
}`,
  },

  // Patterns
  {
    id: 'mapping-struct',
    name: 'Mapping with Struct',
    description: 'Store complex data per address',
    category: 'patterns',
    code: `struct User {
    uint256 balance;
    uint256 lastActive;
    bool isRegistered;
}

mapping(address => User) public users;

function register() external {
    require(!users[msg.sender].isRegistered, "Already registered");
    users[msg.sender] = User({
        balance: 0,
        lastActive: block.timestamp,
        isRegistered: true
    });
}`,
  },
  {
    id: 'enumerable-set',
    name: 'Array with Mapping',
    description: 'Track items with O(1) lookup',
    category: 'patterns',
    code: `address[] public members;
mapping(address => uint256) public memberIndex;
mapping(address => bool) public isMember;

function addMember(address member) external {
    require(!isMember[member], "Already a member");
    memberIndex[member] = members.length;
    members.push(member);
    isMember[member] = true;
}

function removeMember(address member) external {
    require(isMember[member], "Not a member");
    uint256 index = memberIndex[member];
    address lastMember = members[members.length - 1];
    
    members[index] = lastMember;
    memberIndex[lastMember] = index;
    members.pop();
    
    delete memberIndex[member];
    isMember[member] = false;
}`,
  },

  // Utils
  {
    id: 'receive-eth',
    name: 'Receive ETH',
    description: 'Accept ETH payments',
    category: 'utils',
    code: `// Accept ETH with data
receive() external payable {
    emit Received(msg.sender, msg.value);
}

// Accept ETH without data
fallback() external payable {
    emit Received(msg.sender, msg.value);
}

event Received(address indexed sender, uint256 amount);`,
  },
  {
    id: 'withdraw-eth',
    name: 'Withdraw ETH',
    description: 'Withdraw ETH from contract',
    category: 'utils',
    code: `function withdraw() external onlyOwner {
    uint256 balance = address(this).balance;
    require(balance > 0, "No ETH to withdraw");
    
    (bool success, ) = owner.call{value: balance}("");
    require(success, "Withdraw failed");
}

function getBalance() external view returns (uint256) {
    return address(this).balance;
}`,
  },
  {
    id: 'timestamp',
    name: 'Time-based Logic',
    description: 'Use block timestamps',
    category: 'utils',
    code: `uint256 public startTime;
uint256 public endTime;

constructor(uint256 duration) {
    startTime = block.timestamp;
    endTime = block.timestamp + duration;
}

modifier onlyDuringPeriod() {
    require(block.timestamp >= startTime, "Not started yet");
    require(block.timestamp <= endTime, "Already ended");
    _;
}`,
  },
];

export const SNIPPET_CATEGORIES = {
  basics: { name: 'Basics', icon: '📚' },
  tokens: { name: 'Tokens', icon: '🪙' },
  nft: { name: 'NFTs', icon: '🖼️' },
  security: { name: 'Security', icon: '🔒' },
  patterns: { name: 'Patterns', icon: '🧩' },
  utils: { name: 'Utilities', icon: '🔧' },
};

export function getSnippetsByCategory(category: string): CodeSnippet[] {
  return CODE_SNIPPETS.filter((s) => s.category === category);
}
