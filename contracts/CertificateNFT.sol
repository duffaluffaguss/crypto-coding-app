// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ICertificateNFT.sol";

/**
 * @title CertificateNFT
 * @dev ERC-721 NFT contract for issuing completion certificates
 * @notice Only authorized minters can mint certificates, one per user per project
 * @notice Supports soulbound (non-transferable) tokens
 */
contract CertificateNFT is ICertificateNFT, ERC721, ERC721URIStorage, Ownable {
    // ============ State Variables ============
    
    /// @dev Counter for token IDs
    uint256 private _nextTokenId;
    
    /// @dev Base URI for metadata API
    string private _baseTokenURI;
    
    /// @dev Whether tokens are soulbound (non-transferable)
    bool public soulbound;
    
    /// @dev Mapping of authorized minters
    mapping(address => bool) public authorizedMinters;
    
    /// @dev Mapping of user => projectId => hasMinted
    mapping(address => mapping(string => bool)) private _userProjectMinted;
    
    /// @dev Mapping of user => projectId => tokenId
    mapping(address => mapping(string => uint256)) private _userProjectToken;
    
    /// @dev Mapping of tokenId => Certificate data
    mapping(uint256 => Certificate) private _certificates;

    // ============ Errors ============
    
    error NotAuthorizedMinter();
    error MintToZeroAddress();
    error EmptyProjectId();
    error AlreadyMintedForProject();
    error TokenDoesNotExist();
    error NoCertificateForProject();
    error SoulboundTokenCannotBeTransferred();
    error InvalidScore();

    // ============ Modifiers ============
    
    modifier onlyMinter() {
        if (!authorizedMinters[msg.sender]) revert NotAuthorizedMinter();
        _;
    }

    // ============ Constructor ============
    
    /**
     * @dev Initializes the contract with name, symbol, base URI, and soulbound setting
     * @param baseURI The base URI for token metadata
     * @param _soulbound Whether tokens should be non-transferable
     */
    constructor(string memory baseURI, bool _soulbound) ERC721("CryptoCode Certificate", "CCERT") Ownable(msg.sender) {
        _baseTokenURI = baseURI;
        soulbound = _soulbound;
        // Owner is automatically an authorized minter
        authorizedMinters[msg.sender] = true;
        emit SoulboundStatusUpdated(_soulbound);
    }

    // ============ Admin Functions ============
    
    /**
     * @dev Adds or removes an authorized minter
     * @param minter Address to modify
     * @param authorized Whether the address should be authorized
     */
    function setMinter(address minter, bool authorized) external onlyOwner {
        authorizedMinters[minter] = authorized;
        emit MinterUpdated(minter, authorized);
    }
    
    /**
     * @dev Updates the base URI for metadata
     * @param baseURI New base URI
     */
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev Updates the soulbound status
     * @param _soulbound Whether tokens should be non-transferable
     */
    function setSoulbound(bool _soulbound) external onlyOwner {
        soulbound = _soulbound;
        emit SoulboundStatusUpdated(_soulbound);
    }

    // ============ Minting Functions ============
    
    /**
     * @dev Mints a certificate NFT to a user
     * @param to Recipient address
     * @param projectId Unique project identifier
     * @param projectName Human-readable project name
     * @param projectType Type of project (e.g., "smart-contract", "defi", "nft")
     * @param score User's score (0-100)
     * @return tokenId The ID of the minted token
     */
    function mintCertificate(
        address to,
        string calldata projectId,
        string calldata projectName,
        string calldata projectType,
        uint256 score
    ) external onlyMinter returns (uint256) {
        if (to == address(0)) revert MintToZeroAddress();
        if (bytes(projectId).length == 0) revert EmptyProjectId();
        if (_userProjectMinted[to][projectId]) revert AlreadyMintedForProject();
        if (score > 100) revert InvalidScore();
        
        uint256 tokenId = _nextTokenId++;
        
        // Store certificate data
        _certificates[tokenId] = Certificate({
            projectId: projectId,
            projectName: projectName,
            projectType: projectType,
            recipient: to,
            completionDate: block.timestamp,
            tokenId: tokenId,
            score: score
        });
        
        // Mark as minted
        _userProjectMinted[to][projectId] = true;
        _userProjectToken[to][projectId] = tokenId;
        
        // Mint the NFT
        _safeMint(to, tokenId);
        
        emit CertificateMinted(tokenId, to, projectId, score);
        
        return tokenId;
    }

    // ============ View Functions ============
    
    /**
     * @dev Checks if a user has already minted for a specific project
     * @param user Address to check
     * @param projectId Project identifier
     * @return bool Whether the user has minted for this project
     */
    function hasMinted(address user, string calldata projectId) external view returns (bool) {
        return _userProjectMinted[user][projectId];
    }
    
    /**
     * @dev Gets the token ID for a user's project certificate
     * @param user Address to check
     * @param projectId Project identifier
     * @return tokenId The token ID (reverts if not minted)
     */
    function getTokenForProject(address user, string calldata projectId) external view returns (uint256) {
        if (!_userProjectMinted[user][projectId]) revert NoCertificateForProject();
        return _userProjectToken[user][projectId];
    }
    
    /**
     * @dev Gets certificate data for a token
     * @param tokenId Token to query
     * @return Certificate struct with all metadata
     */
    function getCertificate(uint256 tokenId) external view returns (Certificate memory) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist();
        return _certificates[tokenId];
    }
    
    /**
     * @dev Returns the total number of certificates minted
     * @return uint256 Total supply
     */
    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }
    
    /**
     * @dev Checks if token is soulbound
     * @return bool Whether tokens are non-transferable
     */
    function isSoulbound() external view returns (bool) {
        return soulbound;
    }

    // ============ Overrides ============
    
    /**
     * @dev Returns the base URI for token metadata
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @dev Returns the token URI for a given token ID
     * @param tokenId Token to query
     * @return string Full URI for token metadata
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist();
        return string(abi.encodePacked(_baseTokenURI, "/api/certificate/", _toString(tokenId)));
    }
    
    /**
     * @dev See {IERC165-supportsInterface}
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    /**
     * @dev Hook that is called before any token transfer
     * @notice Enforces soulbound restriction when enabled
     */
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) and burning (to == address(0))
        // Block transfers if soulbound
        if (soulbound && from != address(0) && to != address(0)) {
            revert SoulboundTokenCannotBeTransferred();
        }
        
        return super._update(to, tokenId, auth);
    }
    
    // ============ Internal Helpers ============
    
    /**
     * @dev Converts a uint256 to its ASCII string decimal representation
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
