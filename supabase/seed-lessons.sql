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
),
(
  'token-06-minting',
  'Minting New Tokens',
  'Add the ability for the owner to create new tokens.',
  'token',
  6,
  'token-05-transferfrom',
  'address public owner;
uint256 public maxSupply = 1000000 * 10 ** 18; // 1 million tokens max

// Set owner in constructor
// owner = msg.sender;

modifier onlyOwner() {
    require(msg.sender == owner, "Only owner can call this");
    _;
}

function mint(address _to, uint256 _amount) public onlyOwner returns (bool) {
    require(_to != address(0), "Cannot mint to zero address");
    require(totalSupply + _amount <= maxSupply, "Would exceed max supply");

    totalSupply += _amount;
    balanceOf[_to] += _amount;

    emit Transfer(address(0), _to, _amount);
    return true;
}',
  ARRAY['minting', 'onlyOwner modifier', 'max supply cap', 'access control']
),
(
  'token-07-burning',
  'Burning Tokens',
  'Allow users to permanently destroy their tokens.',
  'token',
  7,
  'token-06-minting',
  'function burn(uint256 _amount) public returns (bool) {
    require(balanceOf[msg.sender] >= _amount, "Insufficient balance to burn");

    balanceOf[msg.sender] -= _amount;
    totalSupply -= _amount;

    emit Transfer(msg.sender, address(0), _amount);
    return true;
}

function burnFrom(address _from, uint256 _amount) public returns (bool) {
    require(balanceOf[_from] >= _amount, "Insufficient balance");
    require(allowance[_from][msg.sender] >= _amount, "Insufficient allowance");

    balanceOf[_from] -= _amount;
    totalSupply -= _amount;
    allowance[_from][msg.sender] -= _amount;

    emit Transfer(_from, address(0), _amount);
    return true;
}',
  ARRAY['burning tokens', 'deflationary mechanics', 'burnFrom']
),
(
  'token-08-pausable',
  'Pausable Transfers',
  'Add emergency pause functionality to stop all transfers.',
  'token',
  8,
  'token-07-burning',
  'bool public paused = false;

event Paused(address account);
event Unpaused(address account);

modifier whenNotPaused() {
    require(!paused, "Token transfers are paused");
    _;
}

function pause() public onlyOwner {
    require(!paused, "Already paused");
    paused = true;
    emit Paused(msg.sender);
}

function unpause() public onlyOwner {
    require(paused, "Not paused");
    paused = false;
    emit Unpaused(msg.sender);
}

// Add whenNotPaused modifier to transfer, transferFrom, etc:
// function transfer(...) public whenNotPaused returns (bool) { ... }',
  ARRAY['pausable pattern', 'emergency stop', 'security feature']
),
(
  'token-09-metadata',
  'Full ERC-20 Interface',
  'Review the complete ERC-20 interface and add any missing pieces.',
  'token',
  9,
  'token-08-pausable',
  '// Complete ERC-20 interface checklist:

// Required state:
// string public name;
// string public symbol;
// uint8 public decimals;
// uint256 public totalSupply;
// mapping(address => uint256) public balanceOf;
// mapping(address => mapping(address => uint256)) public allowance;

// Required functions:
// transfer(address to, uint256 amount) returns (bool)
// approve(address spender, uint256 amount) returns (bool)
// transferFrom(address from, address to, uint256 amount) returns (bool)

// Required events:
// event Transfer(address indexed from, address indexed to, uint256 value);
// event Approval(address indexed owner, address indexed spender, uint256 value);

// Optional but recommended:
// function increaseAllowance(address spender, uint256 addedValue) public returns (bool) {
//     approve(spender, allowance[msg.sender][spender] + addedValue);
//     return true;
// }
//
// function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool) {
//     uint256 currentAllowance = allowance[msg.sender][spender];
//     require(currentAllowance >= subtractedValue, "Decreased allowance below zero");
//     approve(spender, currentAllowance - subtractedValue);
//     return true;
// }',
  ARRAY['ERC-20 standard', 'interface compliance', 'increaseAllowance', 'decreaseAllowance']
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
),
(
  'dao-05-quorum',
  'Quorum Requirements',
  'Add minimum participation requirements for valid votes.',
  'dao',
  5,
  'dao-04-voting',
  'uint256 public quorumPercentage = 50; // 50% of members must vote

function getQuorum() public view returns (uint256) {
    return (memberCount * quorumPercentage) / 100;
}

function hasReachedQuorum(uint256 _proposalId) public view returns (bool) {
    Proposal storage proposal = proposals[_proposalId];
    uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
    return totalVotes >= getQuorum();
}

function getProposalStatus(uint256 _proposalId) public view returns (string memory) {
    Proposal storage proposal = proposals[_proposalId];

    if (block.timestamp < proposal.deadline) {
        return "Active";
    }

    if (!hasReachedQuorum(_proposalId)) {
        return "Failed - No Quorum";
    }

    if (proposal.forVotes > proposal.againstVotes) {
        return proposal.executed ? "Executed" : "Passed - Awaiting Execution";
    }

    return "Rejected";
}',
  ARRAY['quorum', 'minimum participation', 'proposal status']
);

-- Creator Lessons (For Artists, Musicians, Makers)
-- Focused on real-world creator use cases: art, music, merchandise, fan engagement
insert into public.lessons (id, title, description, project_type, "order", prerequisite_lesson_id, code_template, concepts) values
(
  'creator-01-basics',
  'Your Creator Contract',
  'Build a contract to sell your art, music, or creative work directly to fans - no middleman taking 30%+.',
  'creator',
  1,
  null,
  '// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Think of this like your own Bandcamp, Etsy, or Gumroad - but YOU control everything
// No platform fees, no account bans, no algorithm changes affecting your income

contract __CREATOR_NAME__ {
    string public creatorName = "__DISPLAY_NAME__";
    address public creator;
    uint256 public totalWorks;

    constructor() {
        creator = msg.sender; // You are the creator/owner
    }

    modifier onlyCreator() {
        require(msg.sender == creator, "Only the creator can do this");
        _;
    }
}',
  ARRAY['creator ownership', 'no middleman', 'direct sales']
),
(
  'creator-02-mint-work',
  'Minting Your Work',
  'Create digital certificates of authenticity for your art, music, photos, or designs.',
  'creator',
  2,
  'creator-01-basics',
  '// Each "work" is like a certificate of authenticity that proves someone owns your creation
// Works for: digital art, music tracks, photos, designs, videos, 3D models, etc.

struct CreativeWork {
    uint256 id;
    string title;           // "Sunset Photography #1" or "Summer Beat"
    string contentURI;      // Link to the actual file (IPFS, your server, etc.)
    uint256 price;
    uint256 editionSize;    // How many copies exist (1 = unique, 100 = limited edition)
    uint256 editionsMinted;
    bool isActive;
}

CreativeWork[] public works;

function createWork(
    string memory _title,
    string memory _contentURI,
    uint256 _price,
    uint256 _editionSize
) public onlyCreator {
    works.push(CreativeWork({
        id: works.length,
        title: _title,
        contentURI: _contentURI,
        price: _price,
        editionSize: _editionSize,
        editionsMinted: 0,
        isActive: true
    }));

    emit WorkCreated(works.length - 1, _title, _price, _editionSize);
}

event WorkCreated(uint256 indexed workId, string title, uint256 price, uint256 editionSize);',
  ARRAY['digital ownership', 'editions', 'content URI', 'creative works']
),
(
  'creator-03-selling',
  'Selling to Collectors',
  'Let fans purchase your work and receive proof of ownership.',
  'creator',
  3,
  'creator-02-mint-work',
  '// Track who owns which edition of each work
mapping(uint256 => mapping(uint256 => address)) public editionOwners; // workId => edition# => owner
mapping(address => uint256[]) public collectorWorks; // What works does each fan own?

function purchase(uint256 _workId) public payable {
    require(_workId < works.length, "Work does not exist");
    CreativeWork storage work = works[_workId];

    require(work.isActive, "This work is not for sale");
    require(work.editionsMinted < work.editionSize, "Sold out!");
    require(msg.value >= work.price, "Not enough payment");

    work.editionsMinted++;
    uint256 editionNumber = work.editionsMinted;

    editionOwners[_workId][editionNumber] = msg.sender;
    collectorWorks[msg.sender].push(_workId);

    // Send payment directly to creator - no middleman!
    (bool success, ) = payable(creator).call{value: msg.value}("");
    require(success, "Payment failed");

    emit WorkPurchased(_workId, editionNumber, msg.sender, work.price);
}

event WorkPurchased(uint256 indexed workId, uint256 edition, address indexed buyer, uint256 price);',
  ARRAY['direct payments', 'edition tracking', 'collector ownership', 'no platform fees']
),
(
  'creator-04-royalties',
  'Royalties on Resales',
  'Automatically earn money every time your work is resold - forever.',
  'creator',
  4,
  'creator-03-selling',
  '// This is huge for creators! Unlike selling a painting once, you earn on EVERY resale
// If your art sells for $100, then $1000, then $10000 - you get paid each time

uint256 public royaltyPercent = 10; // 10% on every resale (you can adjust this)

function resell(uint256 _workId, uint256 _edition, address _newOwner) public payable {
    require(editionOwners[_workId][_edition] == msg.sender, "You dont own this");
    require(_newOwner != address(0), "Invalid buyer");
    require(msg.value > 0, "Must have a sale price");

    // Calculate royalty for the original creator
    uint256 royalty = (msg.value * royaltyPercent) / 100;
    uint256 sellerProceeds = msg.value - royalty;

    // Pay the original creator their royalty
    (bool royaltyPaid, ) = payable(creator).call{value: royalty}("");
    require(royaltyPaid, "Royalty payment failed");

    // Pay the seller
    (bool sellerPaid, ) = payable(msg.sender).call{value: sellerProceeds}("");
    require(sellerPaid, "Seller payment failed");

    // Transfer ownership
    editionOwners[_workId][_edition] = _newOwner;

    emit Resale(_workId, _edition, msg.sender, _newOwner, msg.value, royalty);
}

event Resale(uint256 indexed workId, uint256 edition, address seller, address buyer, uint256 price, uint256 royalty);',
  ARRAY['royalties', 'resale income', 'passive earnings', 'creator economy']
),
(
  'creator-05-collaborators',
  'Split Payments with Collaborators',
  'Automatically split earnings with bandmates, co-creators, or collaborators.',
  'creator',
  5,
  'creator-04-royalties',
  '// Perfect for: bands splitting music revenue, artists with managers,
// photographers with models, podcasters with co-hosts, etc.

struct Collaborator {
    address wallet;
    uint256 sharePercent; // Their percentage of earnings
    string role;          // "Producer", "Featured Artist", "Manager", etc.
}

Collaborator[] public collaborators;
uint256 public creatorSharePercent = 70; // Creator keeps 70%, rest split among collaborators

function addCollaborator(address _wallet, uint256 _sharePercent, string memory _role) public onlyCreator {
    require(_sharePercent > 0 && _sharePercent <= 100, "Invalid share");
    collaborators.push(Collaborator(_wallet, _sharePercent, _role));
    emit CollaboratorAdded(_wallet, _sharePercent, _role);
}

function withdrawEarnings() public onlyCreator {
    uint256 balance = address(this).balance;
    require(balance > 0, "No earnings to withdraw");

    // Pay creator their share
    uint256 creatorAmount = (balance * creatorSharePercent) / 100;
    (bool creatorPaid, ) = payable(creator).call{value: creatorAmount}("");
    require(creatorPaid, "Creator payment failed");

    // Pay each collaborator
    uint256 remaining = balance - creatorAmount;
    for (uint256 i = 0; i < collaborators.length; i++) {
        uint256 collabAmount = (remaining * collaborators[i].sharePercent) / 100;
        (bool paid, ) = payable(collaborators[i].wallet).call{value: collabAmount}("");
        require(paid, "Collaborator payment failed");
    }

    emit EarningsWithdrawn(balance);
}

event CollaboratorAdded(address indexed wallet, uint256 sharePercent, string role);
event EarningsWithdrawn(uint256 amount);',
  ARRAY['payment splits', 'collaborator management', 'automatic distribution', 'band payments']
),
(
  'creator-06-membership',
  'Fan Memberships',
  'Create a membership or Patreon-style subscription for your biggest fans.',
  'creator',
  6,
  'creator-05-collaborators',
  '// Like Patreon but: no 8-12% platform fee, no account suspensions,
// fans truly "own" their membership, you control everything

uint256 public membershipPrice = 0.01 ether; // Monthly-ish membership price
mapping(address => uint256) public membershipExpiry; // When does their membership expire?

function joinMembership() public payable {
    require(msg.value >= membershipPrice, "Membership fee required");

    // If already a member, extend. If new, start from now.
    if (membershipExpiry[msg.sender] > block.timestamp) {
        membershipExpiry[msg.sender] += 30 days;
    } else {
        membershipExpiry[msg.sender] = block.timestamp + 30 days;
    }

    emit MemberJoined(msg.sender, membershipExpiry[msg.sender]);
}

function isMember(address _fan) public view returns (bool) {
    return membershipExpiry[_fan] > block.timestamp;
}

function getMembershipStatus(address _fan) public view returns (bool active, uint256 expiresAt) {
    return (isMember(_fan), membershipExpiry[_fan]);
}

// Members could get: early access, exclusive content, behind-the-scenes, etc.
// Check isMember() in your website/app to gate content

event MemberJoined(address indexed fan, uint256 expiresAt);',
  ARRAY['memberships', 'fan subscriptions', 'gated content', 'recurring support']
),
(
  'creator-07-unlockables',
  'Unlockable Content',
  'Give buyers access to exclusive content, downloads, or experiences.',
  'creator',
  7,
  'creator-06-membership',
  '// Unlockables are hidden content that only owners can access
// Examples: high-res downloads, stems/project files, behind-the-scenes video,
// early access links, secret Discord invite, physical item claim codes

mapping(uint256 => string) private unlockableContent; // workId => secret content
mapping(uint256 => bool) public hasUnlockable;

function setUnlockable(uint256 _workId, string memory _secretContent) public onlyCreator {
    require(_workId < works.length, "Work does not exist");
    unlockableContent[_workId] = _secretContent;
    hasUnlockable[_workId] = true;
    emit UnlockableSet(_workId);
}

function getUnlockable(uint256 _workId, uint256 _edition) public view returns (string memory) {
    require(editionOwners[_workId][_edition] == msg.sender, "You dont own this edition");
    require(hasUnlockable[_workId], "No unlockable content");
    return unlockableContent[_workId];
}

// Examples of unlockable content:
// - "ipfs://Qm.../highres.png" (high-res version)
// - "https://drive.google.com/..." (stems/source files)
// - "DISCOUNT20" (coupon code for merch)
// - "https://discord.gg/secret" (private community invite)

event UnlockableSet(uint256 indexed workId);',
  ARRAY['unlockables', 'gated content', 'exclusive downloads', 'bonus content']
),
(
  'creator-08-portfolio',
  'Your Portfolio View',
  'Add functions so your website can display your work beautifully.',
  'creator',
  8,
  'creator-07-unlockables',
  '// These functions make it easy to build a website/portfolio showing your work

function getWorkDetails(uint256 _workId) public view returns (
    string memory title,
    string memory contentURI,
    uint256 price,
    uint256 editionSize,
    uint256 editionsMinted,
    bool isActive,
    bool soldOut
) {
    require(_workId < works.length, "Work does not exist");
    CreativeWork storage work = works[_workId];
    return (
        work.title,
        work.contentURI,
        work.price,
        work.editionSize,
        work.editionsMinted,
        work.isActive,
        work.editionsMinted >= work.editionSize
    );
}

function getTotalWorks() public view returns (uint256) {
    return works.length;
}

function getCollectorCollection(address _collector) public view returns (uint256[] memory) {
    return collectorWorks[_collector];
}

function getCreatorStats() public view returns (
    string memory name,
    uint256 totalWorksCount,
    uint256 totalCollaborators,
    uint256 contractBalance
) {
    return (creatorName, works.length, collaborators.length, address(this).balance);
}

// Use these in your website to show:
// - Gallery of all your works
// - "X of Y editions remaining"
// - Collector profile pages
// - Your earnings dashboard',
  ARRAY['portfolio', 'frontend integration', 'collector views', 'statistics']
),
(
  'creator-09-tickets',
  'Event Tickets & Passes',
  'Sell tickets to shows, workshops, or events that fans actually own and can resell fairly.',
  'creator',
  9,
  'creator-08-portfolio',
  '// Unlike Ticketmaster: no crazy fees, YOU set resale rules, fans own their tickets
// Works for: concerts, workshops, online events, meetups, gallery openings

struct Event {
    uint256 id;
    string name;           // "Summer Tour - NYC" or "Photoshop Workshop"
    uint256 date;          // Unix timestamp
    uint256 ticketPrice;
    uint256 maxTickets;
    uint256 ticketsSold;
    uint256 maxResalePrice; // Prevent scalping! Set max resale price
    bool isActive;
}

Event[] public events;
mapping(uint256 => mapping(address => uint256)) public ticketsOwned; // eventId => owner => quantity

function createEvent(
    string memory _name,
    uint256 _date,
    uint256 _ticketPrice,
    uint256 _maxTickets,
    uint256 _maxResalePrice
) public onlyCreator {
    events.push(Event({
        id: events.length,
        name: _name,
        date: _date,
        ticketPrice: _ticketPrice,
        maxTickets: _maxTickets,
        ticketsSold: 0,
        maxResalePrice: _maxResalePrice, // e.g., 1.5x original = no crazy scalping
        isActive: true
    }));
    emit EventCreated(events.length - 1, _name, _date, _ticketPrice);
}

function buyTicket(uint256 _eventId, uint256 _quantity) public payable {
    Event storage evt = events[_eventId];
    require(evt.isActive, "Event not active");
    require(evt.ticketsSold + _quantity <= evt.maxTickets, "Not enough tickets");
    require(msg.value >= evt.ticketPrice * _quantity, "Not enough payment");

    evt.ticketsSold += _quantity;
    ticketsOwned[_eventId][msg.sender] += _quantity;

    (bool success, ) = payable(creator).call{value: msg.value}("");
    require(success, "Payment failed");

    emit TicketPurchased(_eventId, msg.sender, _quantity);
}

event EventCreated(uint256 indexed eventId, string name, uint256 date, uint256 price);
event TicketPurchased(uint256 indexed eventId, address indexed buyer, uint256 quantity);',
  ARRAY['event tickets', 'anti-scalping', 'max resale price', 'ticket ownership']
),
(
  'creator-10-commissions',
  'Custom Commissions',
  'Take custom work orders on-chain with built-in escrow protection for both sides.',
  'creator',
  10,
  'creator-09-tickets',
  '// Perfect for: custom art commissions, logo design, music production, portraits
// Escrow protects BOTH sides: client pays upfront, creator delivers, then gets paid

enum CommissionStatus { Open, InProgress, Delivered, Completed, Disputed, Refunded }

struct Commission {
    uint256 id;
    address client;
    string description;     // "Portrait of my dog in space"
    uint256 price;
    uint256 deadline;
    CommissionStatus status;
    string deliveryURI;     // Link to finished work
}

Commission[] public commissions;

function requestCommission(string memory _description, uint256 _deadline) public payable {
    require(msg.value > 0, "Must include payment");

    commissions.push(Commission({
        id: commissions.length,
        client: msg.sender,
        description: _description,
        price: msg.value,
        deadline: _deadline,
        status: CommissionStatus.Open,
        deliveryURI: ""
    }));

    emit CommissionRequested(commissions.length - 1, msg.sender, _description, msg.value);
}

function acceptCommission(uint256 _commissionId) public onlyCreator {
    Commission storage c = commissions[_commissionId];
    require(c.status == CommissionStatus.Open, "Not open");
    c.status = CommissionStatus.InProgress;
    emit CommissionAccepted(_commissionId);
}

function deliverCommission(uint256 _commissionId, string memory _deliveryURI) public onlyCreator {
    Commission storage c = commissions[_commissionId];
    require(c.status == CommissionStatus.InProgress, "Not in progress");
    c.deliveryURI = _deliveryURI;
    c.status = CommissionStatus.Delivered;
    emit CommissionDelivered(_commissionId, _deliveryURI);
}

function approveDelivery(uint256 _commissionId) public {
    Commission storage c = commissions[_commissionId];
    require(msg.sender == c.client, "Only client can approve");
    require(c.status == CommissionStatus.Delivered, "Not delivered yet");

    c.status = CommissionStatus.Completed;

    // Release payment to creator
    (bool success, ) = payable(creator).call{value: c.price}("");
    require(success, "Payment failed");

    emit CommissionCompleted(_commissionId);
}

event CommissionRequested(uint256 indexed id, address client, string description, uint256 price);
event CommissionAccepted(uint256 indexed id);
event CommissionDelivered(uint256 indexed id, string deliveryURI);
event CommissionCompleted(uint256 indexed id);',
  ARRAY['commissions', 'escrow', 'custom orders', 'client protection']
),
(
  'creator-11-crowdfunding',
  'Crowdfund Your Project',
  'Raise funds for an album, art series, or project - like Kickstarter but you keep more.',
  'creator',
  11,
  'creator-10-commissions',
  '// Kickstarter takes 5% + payment fees. Here YOU keep almost everything.
// Perfect for: funding an album, art book, tour, equipment, studio time

struct Campaign {
    uint256 id;
    string title;           // "New Album: Midnight Dreams"
    string description;
    uint256 goal;           // Funding goal in wei
    uint256 deadline;
    uint256 raised;
    bool claimed;
    bool goalReached;
}

Campaign[] public campaigns;
mapping(uint256 => mapping(address => uint256)) public contributions;

function createCampaign(
    string memory _title,
    string memory _description,
    uint256 _goal,
    uint256 _durationDays
) public onlyCreator {
    campaigns.push(Campaign({
        id: campaigns.length,
        title: _title,
        description: _description,
        goal: _goal,
        deadline: block.timestamp + (_durationDays * 1 days),
        raised: 0,
        claimed: false,
        goalReached: false
    }));
    emit CampaignCreated(campaigns.length - 1, _title, _goal);
}

function backProject(uint256 _campaignId) public payable {
    Campaign storage c = campaigns[_campaignId];
    require(block.timestamp < c.deadline, "Campaign ended");
    require(msg.value > 0, "Must contribute something");

    c.raised += msg.value;
    contributions[_campaignId][msg.sender] += msg.value;

    if (c.raised >= c.goal) {
        c.goalReached = true;
    }

    emit ProjectBacked(_campaignId, msg.sender, msg.value, c.raised);
}

function claimFunds(uint256 _campaignId) public onlyCreator {
    Campaign storage c = campaigns[_campaignId];
    require(block.timestamp >= c.deadline, "Campaign still active");
    require(c.goalReached, "Goal not reached - backers can refund");
    require(!c.claimed, "Already claimed");

    c.claimed = true;
    (bool success, ) = payable(creator).call{value: c.raised}("");
    require(success, "Transfer failed");

    emit FundsClaimed(_campaignId, c.raised);
}

function refund(uint256 _campaignId) public {
    Campaign storage c = campaigns[_campaignId];
    require(block.timestamp >= c.deadline, "Campaign still active");
    require(!c.goalReached, "Goal was reached - no refunds");

    uint256 amount = contributions[_campaignId][msg.sender];
    require(amount > 0, "No contribution to refund");

    contributions[_campaignId][msg.sender] = 0;
    (bool success, ) = payable(msg.sender).call{value: amount}("");
    require(success, "Refund failed");

    emit RefundIssued(_campaignId, msg.sender, amount);
}

event CampaignCreated(uint256 indexed id, string title, uint256 goal);
event ProjectBacked(uint256 indexed id, address backer, uint256 amount, uint256 totalRaised);
event FundsClaimed(uint256 indexed id, uint256 amount);
event RefundIssued(uint256 indexed id, address backer, uint256 amount);',
  ARRAY['crowdfunding', 'all-or-nothing', 'backer refunds', 'project funding']
),
(
  'creator-12-licensing',
  'License Your Work',
  'Let others use your photos, music, or designs for a fee - stock licensing you control.',
  'creator',
  12,
  'creator-11-crowdfunding',
  '// Like Shutterstock or AudioJungle but: YOU set the prices, no 50%+ platform cut
// Perfect for: stock photos, music for videos, design assets, templates

enum LicenseType { Personal, Commercial, Exclusive }

struct License {
    uint256 workId;
    address licensee;
    LicenseType licenseType;
    uint256 purchaseDate;
    uint256 expiryDate;     // 0 = perpetual
}

mapping(uint256 => uint256) public personalLicensePrice;
mapping(uint256 => uint256) public commercialLicensePrice;
License[] public licenses;

function setLicensePrices(
    uint256 _workId,
    uint256 _personalPrice,
    uint256 _commercialPrice
) public onlyCreator {
    require(_workId < works.length, "Work does not exist");
    personalLicensePrice[_workId] = _personalPrice;
    commercialLicensePrice[_workId] = _commercialPrice;
    emit LicensePricesSet(_workId, _personalPrice, _commercialPrice);
}

function purchaseLicense(uint256 _workId, LicenseType _type) public payable {
    uint256 price;
    if (_type == LicenseType.Personal) {
        price = personalLicensePrice[_workId];
    } else if (_type == LicenseType.Commercial) {
        price = commercialLicensePrice[_workId];
    } else {
        revert("Contact creator for exclusive licenses");
    }

    require(price > 0, "License not available");
    require(msg.value >= price, "Insufficient payment");

    licenses.push(License({
        workId: _workId,
        licensee: msg.sender,
        licenseType: _type,
        purchaseDate: block.timestamp,
        expiryDate: 0 // Perpetual by default
    }));

    (bool success, ) = payable(creator).call{value: msg.value}("");
    require(success, "Payment failed");

    emit LicensePurchased(_workId, msg.sender, _type, price);
}

function hasValidLicense(address _user, uint256 _workId, LicenseType _minType) public view returns (bool) {
    for (uint256 i = 0; i < licenses.length; i++) {
        if (licenses[i].licensee == _user &&
            licenses[i].workId == _workId &&
            uint8(licenses[i].licenseType) >= uint8(_minType)) {
            if (licenses[i].expiryDate == 0 || licenses[i].expiryDate > block.timestamp) {
                return true;
            }
        }
    }
    return false;
}

event LicensePricesSet(uint256 indexed workId, uint256 personalPrice, uint256 commercialPrice);
event LicensePurchased(uint256 indexed workId, address licensee, LicenseType licenseType, uint256 price);',
  ARRAY['licensing', 'stock content', 'personal vs commercial', 'usage rights']
),
(
  'creator-13-physical',
  'Physical Item Claims',
  'Link digital ownership to physical items - merch, prints, vinyl, limited physicals.',
  'creator',
  13,
  'creator-12-licensing',
  '// Bridge digital and physical! Prove authenticity, prevent counterfeits
// Perfect for: limited prints, vinyl records, signed merch, art prints, fashion

struct PhysicalItem {
    uint256 id;
    uint256 linkedWorkId;   // Which digital work this is tied to (0 if standalone)
    string itemDescription; // "Signed 18x24 Print" or "Limited Vinyl LP"
    uint256 price;
    uint256 totalAvailable;
    uint256 claimed;
    bool requiresDigitalOwnership; // Must own the digital to buy physical?
}

struct Claim {
    uint256 itemId;
    address claimer;
    string shippingHash;    // Hashed shipping info for privacy
    bool shipped;
    bool received;
}

PhysicalItem[] public physicalItems;
Claim[] public claims;

function createPhysicalItem(
    uint256 _linkedWorkId,
    string memory _description,
    uint256 _price,
    uint256 _totalAvailable,
    bool _requiresDigital
) public onlyCreator {
    physicalItems.push(PhysicalItem({
        id: physicalItems.length,
        linkedWorkId: _linkedWorkId,
        itemDescription: _description,
        price: _price,
        totalAvailable: _totalAvailable,
        claimed: 0,
        requiresDigitalOwnership: _requiresDigital
    }));
    emit PhysicalItemCreated(physicalItems.length - 1, _description, _price, _totalAvailable);
}

function claimPhysical(uint256 _itemId, string memory _shippingInfoHash) public payable {
    PhysicalItem storage item = physicalItems[_itemId];
    require(item.claimed < item.totalAvailable, "Sold out");
    require(msg.value >= item.price, "Insufficient payment");

    // If requires digital ownership, verify they own it
    if (item.requiresDigitalOwnership && item.linkedWorkId > 0) {
        bool ownsDigital = false;
        uint256[] memory owned = collectorWorks[msg.sender];
        for (uint256 i = 0; i < owned.length; i++) {
            if (owned[i] == item.linkedWorkId) {
                ownsDigital = true;
                break;
            }
        }
        require(ownsDigital, "Must own the digital version first");
    }

    item.claimed++;
    claims.push(Claim({
        itemId: _itemId,
        claimer: msg.sender,
        shippingHash: _shippingInfoHash,
        shipped: false,
        received: false
    }));

    (bool success, ) = payable(creator).call{value: msg.value}("");
    require(success, "Payment failed");

    emit PhysicalClaimed(_itemId, msg.sender, claims.length - 1);
}

function markShipped(uint256 _claimId) public onlyCreator {
    claims[_claimId].shipped = true;
    emit ItemShipped(_claimId);
}

event PhysicalItemCreated(uint256 indexed id, string description, uint256 price, uint256 available);
event PhysicalClaimed(uint256 indexed itemId, address claimer, uint256 claimId);
event ItemShipped(uint256 indexed claimId);',
  ARRAY['physical items', 'merch', 'digital to physical', 'authenticity']
),
(
  'creator-14-bundles',
  'Bundles & Tiers',
  'Create product bundles and supporter tiers - like offering "Deluxe Edition" packages.',
  'creator',
  14,
  'creator-13-physical',
  '// Bundles let you package multiple items at a discount
// Perfect for: album + merch bundles, art collection packs, supporter tiers

struct Bundle {
    uint256 id;
    string name;            // "Deluxe Fan Package" or "Complete Art Collection"
    uint256[] workIds;      // Which works are included
    uint256[] physicalIds;  // Which physical items included (can be empty)
    bool includesMembership;
    uint256 membershipDays; // How many days of membership included
    uint256 price;          // Discounted bundle price
    uint256 available;
    uint256 sold;
}

Bundle[] public bundles;

function createBundle(
    string memory _name,
    uint256[] memory _workIds,
    uint256[] memory _physicalIds,
    bool _includesMembership,
    uint256 _membershipDays,
    uint256 _price,
    uint256 _available
) public onlyCreator {
    bundles.push(Bundle({
        id: bundles.length,
        name: _name,
        workIds: _workIds,
        physicalIds: _physicalIds,
        includesMembership: _includesMembership,
        membershipDays: _membershipDays,
        price: _price,
        available: _available,
        sold: 0
    }));
    emit BundleCreated(bundles.length - 1, _name, _price);
}

function purchaseBundle(uint256 _bundleId, string memory _shippingHash) public payable {
    Bundle storage b = bundles[_bundleId];
    require(b.sold < b.available, "Bundle sold out");
    require(msg.value >= b.price, "Insufficient payment");

    b.sold++;

    // Grant all digital works
    for (uint256 i = 0; i < b.workIds.length; i++) {
        uint256 workId = b.workIds[i];
        CreativeWork storage work = works[workId];
        if (work.editionsMinted < work.editionSize) {
            work.editionsMinted++;
            editionOwners[workId][work.editionsMinted] = msg.sender;
            collectorWorks[msg.sender].push(workId);
        }
    }

    // Grant membership if included
    if (b.includesMembership && b.membershipDays > 0) {
        if (membershipExpiry[msg.sender] > block.timestamp) {
            membershipExpiry[msg.sender] += b.membershipDays * 1 days;
        } else {
            membershipExpiry[msg.sender] = block.timestamp + (b.membershipDays * 1 days);
        }
    }

    // Physical items need separate claiming with shipping info
    // Store that they are entitled to claim
    for (uint256 i = 0; i < b.physicalIds.length; i++) {
        // In production, track entitlements separately
    }

    (bool success, ) = payable(creator).call{value: msg.value}("");
    require(success, "Payment failed");

    emit BundlePurchased(_bundleId, msg.sender);
}

function getBundleDetails(uint256 _bundleId) public view returns (
    string memory name,
    uint256 price,
    uint256 available,
    uint256 sold,
    bool includesMembership
) {
    Bundle storage b = bundles[_bundleId];
    return (b.name, b.price, b.available, b.sold, b.includesMembership);
}

event BundleCreated(uint256 indexed id, string name, uint256 price);
event BundlePurchased(uint256 indexed id, address buyer);',
  ARRAY['bundles', 'packages', 'supporter tiers', 'discounted collections']
);

-- Game Lessons (Lottery/Raffle Game)
insert into public.lessons (id, title, description, project_type, "order", prerequisite_lesson_id, code_template, concepts) values
(
  'game-01-basics',
  'Your First Game Contract',
  'Create the foundation for your blockchain lottery game.',
  'game',
  1,
  null,
  '// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract __GAME_NAME__ {
    string public name = "__DISPLAY_NAME__";
    address public owner;

    constructor() {
        owner = msg.sender;
    }
}',
  ARRAY['game contract basics', 'ownership']
),
(
  'game-02-entry',
  'Entry Fee & Players',
  'Set up the entry fee and track players who join the game.',
  'game',
  2,
  'game-01-basics',
  'uint256 public entryFee = 0.01 ether;
address[] public players;

function enter() public payable {
    require(msg.value == entryFee, "Must pay exact entry fee");
    players.push(msg.sender);
    emit PlayerEntered(msg.sender);
}

event PlayerEntered(address indexed player);',
  ARRAY['entry fee', 'dynamic arrays', 'player tracking']
),
(
  'game-03-prize',
  'Prize Pool Tracking',
  'Track the total prize pool and game state.',
  'game',
  3,
  'game-02-entry',
  'enum GameState { Open, Closed, Finished }
GameState public state = GameState.Open;

function getPrizePool() public view returns (uint256) {
    return address(this).balance;
}

function getPlayerCount() public view returns (uint256) {
    return players.length;
}',
  ARRAY['enum', 'game state', 'view functions', 'contract balance']
),
(
  'game-04-random',
  'Random Winner Selection',
  'Create a function to randomly select a winner (pseudo-random for learning).',
  'game',
  4,
  'game-03-prize',
  '// Note: This is pseudo-random for learning. Production games should use Chainlink VRF!
function getRandomNumber() private view returns (uint256) {
    return uint256(keccak256(abi.encodePacked(
        block.timestamp,
        block.prevrandao,
        players
    )));
}

uint256 public winnerIndex;
address public winner;',
  ARRAY['pseudo-randomness', 'keccak256', 'abi.encodePacked', 'security note']
),
(
  'game-05-picking',
  'Picking the Winner',
  'Implement the logic to select and announce the winner.',
  'game',
  5,
  'game-04-random',
  'function pickWinner() public {
    require(msg.sender == owner, "Only owner can pick winner");
    require(players.length >= 2, "Need at least 2 players");
    require(state == GameState.Open, "Game not open");

    state = GameState.Closed;
    winnerIndex = getRandomNumber() % players.length;
    winner = players[winnerIndex];

    emit WinnerPicked(winner, getPrizePool());
}

event WinnerPicked(address indexed winner, uint256 prizeAmount);',
  ARRAY['modulo operator', 'access control', 'state transitions']
),
(
  'game-06-payout',
  'Sending the Prize',
  'Transfer the prize pool to the winner.',
  'game',
  6,
  'game-05-picking',
  'function claimPrize() public {
    require(msg.sender == winner, "Only winner can claim");
    require(state == GameState.Closed, "Winner not picked yet");

    state = GameState.Finished;
    uint256 prize = address(this).balance;

    (bool success, ) = payable(winner).call{value: prize}("");
    require(success, "Transfer failed");

    emit PrizeClaimed(winner, prize);
}

event PrizeClaimed(address indexed winner, uint256 amount);',
  ARRAY['call function', 'prize distribution', 'low-level calls']
),
(
  'game-07-reset',
  'Starting a New Round',
  'Add the ability to reset the game for a new round.',
  'game',
  7,
  'game-06-payout',
  'uint256 public roundNumber = 1;

function startNewRound() public {
    require(msg.sender == owner, "Only owner can start new round");
    require(state == GameState.Finished, "Current round not finished");

    delete players;
    winner = address(0);
    winnerIndex = 0;
    state = GameState.Open;
    roundNumber++;

    emit NewRoundStarted(roundNumber);
}

event NewRoundStarted(uint256 indexed round);',
  ARRAY['delete keyword', 'resetting state', 'round tracking']
),
(
  'game-08-views',
  'Player Information',
  'Add helpful view functions for the frontend.',
  'game',
  8,
  'game-07-reset',
  'function getAllPlayers() public view returns (address[] memory) {
    return players;
}

function hasEntered(address _player) public view returns (bool) {
    for (uint256 i = 0; i < players.length; i++) {
        if (players[i] == _player) return true;
    }
    return false;
}

function getGameInfo() public view returns (
    string memory _name,
    uint256 _entryFee,
    uint256 _playerCount,
    uint256 _prizePool,
    GameState _state,
    uint256 _round
) {
    return (name, entryFee, players.length, address(this).balance, state, roundNumber);
}',
  ARRAY['memory keyword', 'loops', 'multiple return values']
);

-- Social Platform Lessons (Decentralized Social Media)
insert into public.lessons (id, title, description, project_type, "order", prerequisite_lesson_id, code_template, concepts) values
(
  'social-01-basics',
  'Your Social Platform Contract',
  'Create the foundation for your decentralized social media platform.',
  'social',
  1,
  null,
  '// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract __SOCIAL_NAME__ {
    string public platformName = "__DISPLAY_NAME__";
    address public owner;
    uint256 public userCount;

    constructor() {
        owner = msg.sender;
    }
}',
  ARRAY['social platform basics', 'user counting']
),
(
  'social-02-profiles',
  'User Profiles',
  'Create a profile system where users can register with usernames.',
  'social',
  2,
  'social-01-basics',
  'struct Profile {
    string username;
    string bio;
    uint256 createdAt;
    bool exists;
}

mapping(address => Profile) public profiles;
mapping(string => address) public usernameToAddress;

function createProfile(string memory _username, string memory _bio) public {
    require(!profiles[msg.sender].exists, "Profile already exists");
    require(usernameToAddress[_username] == address(0), "Username taken");
    require(bytes(_username).length >= 3, "Username too short");

    profiles[msg.sender] = Profile({
        username: _username,
        bio: _bio,
        createdAt: block.timestamp,
        exists: true
    });

    usernameToAddress[_username] = msg.sender;
    userCount++;

    emit ProfileCreated(msg.sender, _username);
}

event ProfileCreated(address indexed user, string username);',
  ARRAY['Profile struct', 'username mapping', 'validation', 'bytes length']
),
(
  'social-03-posts',
  'Creating Posts',
  'Allow users to create and store posts on-chain.',
  'social',
  3,
  'social-02-profiles',
  'struct Post {
    uint256 id;
    address author;
    string content;
    uint256 timestamp;
    uint256 likes;
    uint256 tips;
}

Post[] public posts;

function createPost(string memory _content) public {
    require(profiles[msg.sender].exists, "Create profile first");
    require(bytes(_content).length > 0, "Empty post");
    require(bytes(_content).length <= 280, "Post too long");

    posts.push(Post({
        id: posts.length,
        author: msg.sender,
        content: _content,
        timestamp: block.timestamp,
        likes: 0,
        tips: 0
    }));

    emit PostCreated(posts.length - 1, msg.sender, _content);
}

event PostCreated(uint256 indexed postId, address indexed author, string content);',
  ARRAY['Post struct', 'dynamic arrays', 'content validation', 'character limits']
),
(
  'social-04-likes',
  'Liking Posts',
  'Implement a like system to let users appreciate content.',
  'social',
  4,
  'social-03-posts',
  'mapping(uint256 => mapping(address => bool)) public hasLiked;

function likePost(uint256 _postId) public {
    require(profiles[msg.sender].exists, "Create profile first");
    require(_postId < posts.length, "Post does not exist");
    require(!hasLiked[_postId][msg.sender], "Already liked");

    hasLiked[_postId][msg.sender] = true;
    posts[_postId].likes++;

    emit PostLiked(_postId, msg.sender);
}

function unlikePost(uint256 _postId) public {
    require(hasLiked[_postId][msg.sender], "Not liked yet");

    hasLiked[_postId][msg.sender] = false;
    posts[_postId].likes--;

    emit PostUnliked(_postId, msg.sender);
}

event PostLiked(uint256 indexed postId, address indexed user);
event PostUnliked(uint256 indexed postId, address indexed user);',
  ARRAY['nested mapping', 'like tracking', 'toggle functionality']
),
(
  'social-05-tipping',
  'Tipping Creators',
  'Let users send ETH tips to content creators.',
  'social',
  5,
  'social-04-likes',
  'mapping(address => uint256) public totalTipsReceived;

function tipPost(uint256 _postId) public payable {
    require(profiles[msg.sender].exists, "Create profile first");
    require(_postId < posts.length, "Post does not exist");
    require(msg.value > 0, "Tip must be greater than 0");

    Post storage post = posts[_postId];
    address author = post.author;

    post.tips += msg.value;
    totalTipsReceived[author] += msg.value;

    (bool success, ) = payable(author).call{value: msg.value}("");
    require(success, "Tip transfer failed");

    emit PostTipped(_postId, msg.sender, author, msg.value);
}

event PostTipped(uint256 indexed postId, address indexed tipper, address indexed author, uint256 amount);',
  ARRAY['tipping mechanics', 'ETH transfers', 'creator monetization']
),
(
  'social-06-following',
  'Follow System',
  'Create a follow/unfollow system for users.',
  'social',
  6,
  'social-05-tipping',
  'mapping(address => mapping(address => bool)) public isFollowing;
mapping(address => uint256) public followerCount;
mapping(address => uint256) public followingCount;

function follow(address _user) public {
    require(profiles[msg.sender].exists, "Create profile first");
    require(profiles[_user].exists, "User does not exist");
    require(_user != msg.sender, "Cannot follow yourself");
    require(!isFollowing[msg.sender][_user], "Already following");

    isFollowing[msg.sender][_user] = true;
    followerCount[_user]++;
    followingCount[msg.sender]++;

    emit Followed(msg.sender, _user);
}

function unfollow(address _user) public {
    require(isFollowing[msg.sender][_user], "Not following");

    isFollowing[msg.sender][_user] = false;
    followerCount[_user]--;
    followingCount[msg.sender]--;

    emit Unfollowed(msg.sender, _user);
}

event Followed(address indexed follower, address indexed followed);
event Unfollowed(address indexed follower, address indexed unfollowed);',
  ARRAY['follow relationships', 'social graph', 'counter tracking']
),
(
  'social-07-feed',
  'Fetching Posts',
  'Add view functions to retrieve posts and user data.',
  'social',
  7,
  'social-06-following',
  'function getPost(uint256 _postId) public view returns (
    uint256 id,
    address author,
    string memory content,
    uint256 timestamp,
    uint256 likes,
    uint256 tips
) {
    require(_postId < posts.length, "Post does not exist");
    Post storage post = posts[_postId];
    return (post.id, post.author, post.content, post.timestamp, post.likes, post.tips);
}

function getPostCount() public view returns (uint256) {
    return posts.length;
}

function getProfile(address _user) public view returns (
    string memory username,
    string memory bio,
    uint256 createdAt,
    uint256 followers,
    uint256 following
) {
    require(profiles[_user].exists, "Profile does not exist");
    Profile storage profile = profiles[_user];
    return (
        profile.username,
        profile.bio,
        profile.createdAt,
        followerCount[_user],
        followingCount[_user]
    );
}',
  ARRAY['view functions', 'data retrieval', 'frontend integration']
),
(
  'social-08-updates',
  'Profile Updates',
  'Allow users to update their profile information.',
  'social',
  8,
  'social-07-feed',
  'function updateBio(string memory _newBio) public {
    require(profiles[msg.sender].exists, "Profile does not exist");
    profiles[msg.sender].bio = _newBio;
    emit BioUpdated(msg.sender, _newBio);
}

function deletePost(uint256 _postId) public {
    require(_postId < posts.length, "Post does not exist");
    require(posts[_postId].author == msg.sender, "Not your post");

    // Mark as deleted by clearing content
    posts[_postId].content = "[deleted]";

    emit PostDeleted(_postId, msg.sender);
}

function getPlatformStats() public view returns (
    string memory name,
    uint256 users,
    uint256 totalPosts
) {
    return (platformName, userCount, posts.length);
}

event BioUpdated(address indexed user, string newBio);
event PostDeleted(uint256 indexed postId, address indexed author);',
  ARRAY['profile updates', 'soft delete', 'platform statistics']
);

-- Advanced NFT Lessons (ERC-721 Standard)
insert into public.lessons (id, title, description, project_type, "order", prerequisite_lesson_id, code_template, concepts) values
(
  'nft-09-erc721-interface',
  'The ERC-721 Standard',
  'Learn the official ERC-721 interface that all NFT contracts must implement.',
  'nft_marketplace',
  9,
  'nft-08-events',
  '// ERC-721 is the official NFT standard. Your contract must implement these functions:

// Required view functions:
// balanceOf(address owner) - How many NFTs does this address own?
// ownerOf(uint256 tokenId) - Who owns this specific NFT?

// Required transfer functions:
// transferFrom(from, to, tokenId) - Transfer an NFT
// safeTransferFrom(from, to, tokenId) - Safe transfer with receiver check
// safeTransferFrom(from, to, tokenId, data) - Safe transfer with data

// Required approval functions:
// approve(address to, uint256 tokenId) - Approve one NFT
// setApprovalForAll(address operator, bool approved) - Approve all NFTs
// getApproved(uint256 tokenId) - Who is approved for this NFT?
// isApprovedForAll(owner, operator) - Is operator approved for all?

// Required events:
event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
event ApprovalForAll(address indexed owner, address indexed operator, bool approved);',
  ARRAY['ERC-721 standard', 'interface requirements', 'NFT functions']
),
(
  'nft-10-ownership',
  'Token Ownership Tracking',
  'Implement the core ownership mappings for your NFT collection.',
  'nft_marketplace',
  10,
  'nft-09-erc721-interface',
  '// Core ownership storage
mapping(uint256 => address) private _owners;
mapping(address => uint256) private _balances;

// Token counter
uint256 private _tokenIdCounter;

function balanceOf(address owner) public view returns (uint256) {
    require(owner != address(0), "Balance query for zero address");
    return _balances[owner];
}

function ownerOf(uint256 tokenId) public view returns (address) {
    address owner = _owners[tokenId];
    require(owner != address(0), "Token does not exist");
    return owner;
}

function _exists(uint256 tokenId) internal view returns (bool) {
    return _owners[tokenId] != address(0);
}',
  ARRAY['ownership mapping', 'balance tracking', 'internal functions']
),
(
  'nft-11-minting',
  'Minting NFTs',
  'Create the mint function to create new NFTs in your collection.',
  'nft_marketplace',
  11,
  'nft-10-ownership',
  'uint256 public mintPrice = 0.01 ether;
uint256 public maxSupply = 10000;

function mint() public payable returns (uint256) {
    require(msg.value >= mintPrice, "Insufficient payment");
    require(_tokenIdCounter < maxSupply, "Max supply reached");

    uint256 tokenId = _tokenIdCounter;
    _tokenIdCounter++;

    _owners[tokenId] = msg.sender;
    _balances[msg.sender]++;

    emit Transfer(address(0), msg.sender, tokenId);

    return tokenId;
}

function totalSupply() public view returns (uint256) {
    return _tokenIdCounter;
}',
  ARRAY['minting', 'max supply', 'mint price', 'token creation']
),
(
  'nft-12-metadata',
  'Token Metadata & URI',
  'Add metadata support so NFTs can display images and attributes.',
  'nft_marketplace',
  12,
  'nft-11-minting',
  'string private _baseTokenURI;

// Set the base URI (e.g., "https://myapi.com/nft/")
function setBaseURI(string memory baseURI) public {
    require(msg.sender == owner, "Only owner");
    _baseTokenURI = baseURI;
}

// Returns the full URI for a token (e.g., "https://myapi.com/nft/123")
function tokenURI(uint256 tokenId) public view returns (string memory) {
    require(_exists(tokenId), "Token does not exist");

    if (bytes(_baseTokenURI).length == 0) {
        return "";
    }

    return string(abi.encodePacked(_baseTokenURI, _toString(tokenId)));
}

// Helper to convert uint to string
function _toString(uint256 value) internal pure returns (string memory) {
    if (value == 0) return "0";

    uint256 temp = value;
    uint256 digits;
    while (temp != 0) {
        digits++;
        temp /= 10;
    }

    bytes memory buffer = new bytes(digits);
    while (value != 0) {
        digits--;
        buffer[digits] = bytes1(uint8(48 + (value % 10)));
        value /= 10;
    }

    return string(buffer);
}',
  ARRAY['tokenURI', 'metadata', 'baseURI', 'string concatenation']
),
(
  'nft-13-approvals',
  'NFT Approvals',
  'Implement approval functions so NFTs can be traded on marketplaces.',
  'nft_marketplace',
  13,
  'nft-12-metadata',
  '// Single token approvals
mapping(uint256 => address) private _tokenApprovals;

// Operator approvals (approve all tokens)
mapping(address => mapping(address => bool)) private _operatorApprovals;

function approve(address to, uint256 tokenId) public {
    address tokenOwner = ownerOf(tokenId);
    require(to != tokenOwner, "Cannot approve to owner");
    require(
        msg.sender == tokenOwner || isApprovedForAll(tokenOwner, msg.sender),
        "Not authorized"
    );

    _tokenApprovals[tokenId] = to;
    emit Approval(tokenOwner, to, tokenId);
}

function getApproved(uint256 tokenId) public view returns (address) {
    require(_exists(tokenId), "Token does not exist");
    return _tokenApprovals[tokenId];
}

function setApprovalForAll(address operator, bool approved) public {
    require(operator != msg.sender, "Cannot approve self");
    _operatorApprovals[msg.sender][operator] = approved;
    emit ApprovalForAll(msg.sender, operator, approved);
}

function isApprovedForAll(address tokenOwner, address operator) public view returns (bool) {
    return _operatorApprovals[tokenOwner][operator];
}',
  ARRAY['approve', 'setApprovalForAll', 'operator pattern', 'marketplace integration']
),
(
  'nft-14-transfers',
  'NFT Transfers',
  'Implement the transfer functions to move NFTs between wallets.',
  'nft_marketplace',
  14,
  'nft-13-approvals',
  'function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
    address tokenOwner = ownerOf(tokenId);
    return (
        spender == tokenOwner ||
        getApproved(tokenId) == spender ||
        isApprovedForAll(tokenOwner, spender)
    );
}

function transferFrom(address from, address to, uint256 tokenId) public {
    require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
    require(ownerOf(tokenId) == from, "From is not owner");
    require(to != address(0), "Transfer to zero address");

    // Clear approval
    _tokenApprovals[tokenId] = address(0);

    // Update balances
    _balances[from]--;
    _balances[to]++;

    // Transfer ownership
    _owners[tokenId] = to;

    emit Transfer(from, to, tokenId);
}',
  ARRAY['transferFrom', 'authorization checks', 'ownership transfer']
),
(
  'nft-15-safe-transfer',
  'Safe Transfers',
  'Add safe transfer functions that check if the receiver can handle NFTs.',
  'nft_marketplace',
  15,
  'nft-14-transfers',
  '// Interface ID for ERC721Receiver
bytes4 private constant _ERC721_RECEIVED = 0x150b7a02;

function safeTransferFrom(address from, address to, uint256 tokenId) public {
    safeTransferFrom(from, to, tokenId, "");
}

function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public {
    transferFrom(from, to, tokenId);

    // If recipient is a contract, check it can receive NFTs
    if (to.code.length > 0) {
        try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 response) {
            require(response == _ERC721_RECEIVED, "Invalid receiver");
        } catch {
            revert("Non-ERC721Receiver");
        }
    }
}

// Interface that receivers must implement
interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}',
  ARRAY['safeTransferFrom', 'ERC721Receiver', 'contract safety', 'interface']
),
(
  'nft-16-enumerable',
  'Enumerable Extension',
  'Add functions to list all tokens owned by an address.',
  'nft_marketplace',
  16,
  'nft-15-safe-transfer',
  '// Track tokens owned by each address
mapping(address => uint256[]) private _ownedTokens;
mapping(uint256 => uint256) private _ownedTokensIndex;

// Get token at index for an owner
function tokenOfOwnerByIndex(address tokenOwner, uint256 index) public view returns (uint256) {
    require(index < balanceOf(tokenOwner), "Index out of bounds");
    return _ownedTokens[tokenOwner][index];
}

// Get all tokens owned by an address
function tokensOfOwner(address tokenOwner) public view returns (uint256[] memory) {
    return _ownedTokens[tokenOwner];
}

// Update enumerable data on mint (add to _mint function):
// _ownedTokensIndex[tokenId] = _ownedTokens[msg.sender].length;
// _ownedTokens[msg.sender].push(tokenId);

// Update enumerable data on transfer (add to transferFrom):
// Remove from sender list, add to receiver list
// This is more complex - see OpenZeppelin ERC721Enumerable for full implementation',
  ARRAY['enumerable extension', 'token listing', 'owned tokens array']
);
