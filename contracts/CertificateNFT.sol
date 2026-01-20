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
 */
contract CertificateNFT is ICertificateNFT, ERC721, ERC721URIStorage, Ownable {
    // ============ State Variables ============
    
    /// @dev Counter for token IDs
    uint256 private _nextTokenId;
    
    /// @dev Base URI for metadata API
    string private _baseTokenURI;
    
    /// @dev Mapping of authorized minters
    mapping(address => bool) public authorizedMinters;
    
    /// @dev Mapping of user => projectId => hasMinted
    mapping(address => mapping(string => bool)) private _userProjectMinted;
    
    /// @dev Mapping of user => projectId => tokenId
    mapping(address => mapping(string => uint256)) private _userProjectToken;
    
    /// @dev Mapping of tokenId => Certificate data
    mapping(uint256 => Certificate) private _certificates;

    // ============ Modifiers ============
    
    modifier onlyMinter() {
        require(authorizedMinters[msg.sender], "CertificateNFT: caller is not an authorized minter");
        _;
    }

    // ============ Constructor ============
    
    /**
     * @dev Initializes the contract with name, symbol, and base URI
     * @param baseURI The base URI for token metadata
     */
    constructor(string memory baseURI) ERC721("CryptoCode Certificate", "CCERT") Ownable(msg.sender) {
        _baseTokenURI = baseURI;
        // Owner is automatically an authorized minter
        authorizedMinters[msg.sender] = true;
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

    // ============ Minting Functions ============
    
    /**
     * @dev Mints a certificate NFT to a user
     * @param to Recipient address
     * @param projectId Unique project identifier
     * @param projectName Human-readable project name
     * @param projectType Type of project (e.g., "smart-contract", "defi", "nft")
     * @return tokenId The ID of the minted token
     */
    function mintCertificate(
        address to,
        string calldata projectId,
        string calldata projectName,
        string calldata projectType
    ) external onlyMinter returns (uint256) {
        require(to != address(0), "CertificateNFT: mint to zero address");
        require(bytes(projectId).length > 0, "CertificateNFT: empty project ID");
        require(!_userProjectMinted[to][projectId], "CertificateNFT: already minted for this project");
        
        uint256 tokenId = _nextTokenId++;
        
        // Store certificate data
        _certificates[tokenId] = Certificate({
            projectId: projectId,
            projectName: projectName,
            projectType: projectType,
            recipient: to,
            completionDate: block.timestamp,
            tokenId: tokenId
        });
        
        // Mark as minted
        _userProjectMinted[to][projectId] = true;
        _userProjectToken[to][projectId] = tokenId;
        
        // Mint the NFT
        _safeMint(to, tokenId);
        
        emit CertificateMinted(tokenId, to, projectId);
        
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
        require(_userProjectMinted[user][projectId], "CertificateNFT: no certificate for this project");
        return _userProjectToken[user][projectId];
    }
    
    /**
     * @dev Gets certificate data for a token
     * @param tokenId Token to query
     * @return Certificate struct with all metadata
     */
    function getCertificate(uint256 tokenId) external view returns (Certificate memory) {
        require(_ownerOf(tokenId) != address(0), "CertificateNFT: token does not exist");
        return _certificates[tokenId];
    }
    
    /**
     * @dev Returns the total number of certificates minted
     * @return uint256 Total supply
     */
    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
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
        require(_ownerOf(tokenId) != address(0), "CertificateNFT: token does not exist");
        return string(abi.encodePacked(_baseTokenURI, "/api/certificate/", _toString(tokenId)));
    }
    
    /**
     * @dev See {IERC165-supportsInterface}
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
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
