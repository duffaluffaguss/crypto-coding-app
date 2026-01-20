// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICertificateNFT
 * @dev Interface for the CertificateNFT contract
 */
interface ICertificateNFT {
    // ============ Structs ============
    
    /**
     * @dev Certificate metadata structure
     */
    struct Certificate {
        string projectId;
        string projectName;
        string projectType;
        address recipient;
        uint256 completionDate;
        uint256 tokenId;
        uint256 score;
    }

    // ============ Events ============
    
    /**
     * @dev Emitted when a certificate is minted
     * @param tokenId The ID of the minted token
     * @param user The recipient address
     * @param projectId The project identifier
     * @param score The user's score
     */
    event CertificateMinted(uint256 indexed tokenId, address indexed user, string projectId, uint256 score);
    
    /**
     * @dev Emitted when a minter's authorization is updated
     * @param minter The minter address
     * @param authorized Whether the minter is authorized
     */
    event MinterUpdated(address indexed minter, bool authorized);
    
    /**
     * @dev Emitted when soulbound status is updated
     * @param soulbound Whether tokens are non-transferable
     */
    event SoulboundStatusUpdated(bool soulbound);

    // ============ Functions ============
    
    /**
     * @dev Adds or removes an authorized minter
     * @param minter Address to modify
     * @param authorized Whether the address should be authorized
     */
    function setMinter(address minter, bool authorized) external;
    
    /**
     * @dev Updates the base URI for metadata
     * @param baseURI New base URI
     */
    function setBaseURI(string memory baseURI) external;
    
    /**
     * @dev Updates the soulbound status
     * @param _soulbound Whether tokens should be non-transferable
     */
    function setSoulbound(bool _soulbound) external;
    
    /**
     * @dev Mints a certificate NFT to a user
     * @param to Recipient address
     * @param projectId Unique project identifier
     * @param projectName Human-readable project name
     * @param projectType Type of project
     * @param score User's score (0-100)
     * @return tokenId The ID of the minted token
     */
    function mintCertificate(
        address to,
        string calldata projectId,
        string calldata projectName,
        string calldata projectType,
        uint256 score
    ) external returns (uint256);
    
    /**
     * @dev Checks if a user has already minted for a specific project
     * @param user Address to check
     * @param projectId Project identifier
     * @return bool Whether the user has minted for this project
     */
    function hasMinted(address user, string calldata projectId) external view returns (bool);
    
    /**
     * @dev Gets the token ID for a user's project certificate
     * @param user Address to check
     * @param projectId Project identifier
     * @return tokenId The token ID
     */
    function getTokenForProject(address user, string calldata projectId) external view returns (uint256);
    
    /**
     * @dev Gets certificate data for a token
     * @param tokenId Token to query
     * @return Certificate struct with all metadata
     */
    function getCertificate(uint256 tokenId) external view returns (Certificate memory);
    
    /**
     * @dev Returns the total number of certificates minted
     * @return uint256 Total supply
     */
    function totalSupply() external view returns (uint256);
    
    /**
     * @dev Checks if an address is an authorized minter
     * @param minter Address to check
     * @return bool Whether the address is authorized
     */
    function authorizedMinters(address minter) external view returns (bool);
    
    /**
     * @dev Checks if tokens are soulbound
     * @return bool Whether tokens are non-transferable
     */
    function isSoulbound() external view returns (bool);
    
    /**
     * @dev Returns the soulbound status
     * @return bool Whether tokens are non-transferable
     */
    function soulbound() external view returns (bool);
}
