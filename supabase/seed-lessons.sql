-- Seed data for lessons
-- Run this after schema.sql

-- NFT Marketplace Lessons
insert into public.lessons (id, title, description, project_type, "order", prerequisite_lesson_id, code_template, concepts) values
(
  'nft-01-basics',
  'Your First Smart Contract',
  'Learn the basic structure of a Solidity smart contract by customizing your marketplace name.',
  'nft_marketplace',
  1,
  null,
  '// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract __CONTRACT_NAME__ {
    // Your NFT marketplace starts here!
}',
  ARRAY['SPDX license', 'pragma', 'contract keyword']
),
(
  'nft-02-variables',
  'Storing Data On-Chain',
  'Add state variables to store important data like prices and ownership.',
  'nft_marketplace',
  2,
  'nft-01-basics',
  '// Add these inside your contract:
string public name;
uint256 public listingPrice;
address public owner;',
  ARRAY['state variables', 'uint256', 'address', 'public visibility']
),
(
  'nft-03-constructor',
  'Initialize Your Contract',
  'Create a constructor to set initial values when the contract is deployed.',
  'nft_marketplace',
  3,
  'nft-02-variables',
  'constructor() {
    name = "__YOUR_MARKETPLACE_NAME__";
    listingPrice = 0.01 ether;
    owner = msg.sender;
}',
  ARRAY['constructor', 'msg.sender', 'ether units']
),
(
  'nft-04-structs',
  'Creating Data Structures',
  'Define a struct to represent items listed in your marketplace.',
  'nft_marketplace',
  4,
  'nft-03-constructor',
  'struct MarketItem {
    uint256 id;
    address payable seller;
    address payable owner;
    uint256 price;
    bool sold;
}',
  ARRAY['struct', 'payable address', 'bool']
),
(
  'nft-05-mappings',
  'Organizing Your Data',
  'Use mappings to efficiently store and retrieve market items.',
  'nft_marketplace',
  5,
  'nft-04-structs',
  'mapping(uint256 => MarketItem) public items;
uint256 public itemCount;',
  ARRAY['mapping', 'key-value storage']
),
(
  'nft-06-listing',
  'Creating Listings',
  'Write a function that allows users to list items for sale.',
  'nft_marketplace',
  6,
  'nft-05-mappings',
  'function createListing(uint256 _price) public payable {
    require(_price > 0, "Price must be greater than 0");
    require(msg.value == listingPrice, "Must pay listing fee");

    itemCount++;
    items[itemCount] = MarketItem(
        itemCount,
        payable(msg.sender),
        payable(address(0)),
        _price,
        false
    );
}',
  ARRAY['function', 'require', 'msg.value', 'payable']
),
(
  'nft-07-buying',
  'Accepting Payments',
  'Implement the buy function to let users purchase listed items.',
  'nft_marketplace',
  7,
  'nft-06-listing',
  'function buyItem(uint256 _id) public payable {
    MarketItem storage item = items[_id];
    require(_id > 0 && _id <= itemCount, "Item does not exist");
    require(msg.value == item.price, "Incorrect price");
    require(!item.sold, "Item already sold");

    item.seller.transfer(msg.value);
    item.owner = payable(msg.sender);
    item.sold = true;
}',
  ARRAY['storage keyword', 'transfer', 'buying logic']
),
(
  'nft-08-events',
  'Broadcasting Updates',
  'Add events to notify the frontend when items are listed or sold.',
  'nft_marketplace',
  8,
  'nft-07-buying',
  'event ItemListed(uint256 indexed id, address seller, uint256 price);
event ItemSold(uint256 indexed id, address buyer, uint256 price);

// Add emit ItemListed(...) in createListing
// Add emit ItemSold(...) in buyItem',
  ARRAY['events', 'indexed parameters', 'emit']
);

-- Token Lessons
insert into public.lessons (id, title, description, project_type, "order", prerequisite_lesson_id, code_template, concepts) values
(
  'token-01-basics',
  'Your First Token Contract',
  'Create the foundation for your custom ERC-20 token.',
  'token',
  1,
  null,
  '// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract __TOKEN_NAME__ {
    string public name = "__DISPLAY_NAME__";
    string public symbol = "__SYMBOL__";
    uint8 public decimals = 18;
}',
  ARRAY['ERC-20 basics', 'token metadata', 'decimals']
),
(
  'token-02-supply',
  'Managing Token Supply',
  'Add total supply tracking and initial distribution.',
  'token',
  2,
  'token-01-basics',
  'uint256 public totalSupply;
mapping(address => uint256) public balanceOf;

constructor(uint256 _initialSupply) {
    totalSupply = _initialSupply * 10 ** decimals;
    balanceOf[msg.sender] = totalSupply;
}',
  ARRAY['totalSupply', 'balanceOf mapping', 'initial distribution']
),
(
  'token-03-transfer',
  'Sending Tokens',
  'Implement the core transfer function.',
  'token',
  3,
  'token-02-supply',
  'function transfer(address _to, uint256 _amount) public returns (bool) {
    require(balanceOf[msg.sender] >= _amount, "Insufficient balance");
    require(_to != address(0), "Invalid recipient");

    balanceOf[msg.sender] -= _amount;
    balanceOf[_to] += _amount;

    emit Transfer(msg.sender, _to, _amount);
    return true;
}

event Transfer(address indexed from, address indexed to, uint256 amount);',
  ARRAY['transfer function', 'balance checks', 'Transfer event']
),
(
  'token-04-allowance',
  'Approving Spending',
  'Allow other addresses to spend tokens on your behalf.',
  'token',
  4,
  'token-03-transfer',
  'mapping(address => mapping(address => uint256)) public allowance;

function approve(address _spender, uint256 _amount) public returns (bool) {
    allowance[msg.sender][_spender] = _amount;
    emit Approval(msg.sender, _spender, _amount);
    return true;
}

event Approval(address indexed owner, address indexed spender, uint256 amount);',
  ARRAY['allowance', 'approve function', 'nested mapping']
),
(
  'token-05-transferfrom',
  'Delegated Transfers',
  'Enable approved addresses to transfer tokens.',
  'token',
  5,
  'token-04-allowance',
  'function transferFrom(address _from, address _to, uint256 _amount) public returns (bool) {
    require(balanceOf[_from] >= _amount, "Insufficient balance");
    require(allowance[_from][msg.sender] >= _amount, "Insufficient allowance");

    balanceOf[_from] -= _amount;
    balanceOf[_to] += _amount;
    allowance[_from][msg.sender] -= _amount;

    emit Transfer(_from, _to, _amount);
    return true;
}',
  ARRAY['transferFrom', 'allowance management', 'delegated spending']
);

-- DAO Lessons
insert into public.lessons (id, title, description, project_type, "order", prerequisite_lesson_id, code_template, concepts) values
(
  'dao-01-basics',
  'Your First DAO Contract',
  'Set up the foundation for your decentralized organization.',
  'dao',
  1,
  null,
  '// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract __DAO_NAME__ {
    string public name = "__DISPLAY_NAME__";
    uint256 public memberCount;
    mapping(address => bool) public isMember;
}',
  ARRAY['DAO basics', 'membership tracking']
),
(
  'dao-02-joining',
  'Member Registration',
  'Allow users to join your DAO by paying a membership fee.',
  'dao',
  2,
  'dao-01-basics',
  'uint256 public membershipFee = 0.01 ether;

function join() public payable {
    require(!isMember[msg.sender], "Already a member");
    require(msg.value == membershipFee, "Incorrect fee");

    isMember[msg.sender] = true;
    memberCount++;

    emit MemberJoined(msg.sender);
}

event MemberJoined(address indexed member);',
  ARRAY['membership fee', 'join function', 'member events']
),
(
  'dao-03-proposals',
  'Creating Proposals',
  'Define a proposal structure and let members submit ideas.',
  'dao',
  3,
  'dao-02-joining',
  'struct Proposal {
    uint256 id;
    string description;
    uint256 forVotes;
    uint256 againstVotes;
    uint256 deadline;
    bool executed;
}

Proposal[] public proposals;

function createProposal(string memory _description) public {
    require(isMember[msg.sender], "Must be a member");

    proposals.push(Proposal({
        id: proposals.length,
        description: _description,
        forVotes: 0,
        againstVotes: 0,
        deadline: block.timestamp + 7 days,
        executed: false
    }));
}',
  ARRAY['Proposal struct', 'arrays', 'block.timestamp']
),
(
  'dao-04-voting',
  'Casting Votes',
  'Implement the voting mechanism for proposals.',
  'dao',
  4,
  'dao-03-proposals',
  'mapping(uint256 => mapping(address => bool)) public hasVoted;

function vote(uint256 _proposalId, bool _support) public {
    require(isMember[msg.sender], "Must be a member");
    require(!hasVoted[_proposalId][msg.sender], "Already voted");
    require(block.timestamp < proposals[_proposalId].deadline, "Voting ended");

    hasVoted[_proposalId][msg.sender] = true;

    if (_support) {
        proposals[_proposalId].forVotes++;
    } else {
        proposals[_proposalId].againstVotes++;
    }

    emit VoteCast(msg.sender, _proposalId, _support);
}

event VoteCast(address indexed voter, uint256 indexed proposalId, bool support);',
  ARRAY['voting logic', 'vote tracking', 'deadlines']
);
