// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CertificateVerifier
 * @notice Verifiable on-chain registry for academic / professional credentials.
 *         - Contract owner authorizes issuers (universities / institutions)
 *         - Authorized issuers can issue and revoke certificates
 *         - Anyone can verify a certificate hash
 * @dev    Uses simple mapping; upgradeability & role granularity can be added later (e.g., OpenZeppelin AccessControl).
 */
contract CertificateVerifier {
    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------
    event IssuerAuthorizationChanged(address indexed issuer, bool authorized, address indexed by);
    event CertificateIssued(bytes32 indexed certHash, address indexed issuer, address indexed owner, uint64 issuedAt);
    event CertificateRevoked(bytes32 indexed certHash, address indexed issuer, uint64 revokedAt);

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------
    address public owner; // contract owner (platform admin)

    struct Certificate {
        address issuer;     // authorized issuer who minted
        address owner;      // student / recipient
        uint64 issuedAt;    // block timestamp when issued
        bool revoked;       // if true, certificate has been revoked
        uint64 revokedAt;   // timestamp of revocation (0 if active)
    }

    // certHash => metadata
    mapping(bytes32 => Certificate) private certificates;

    // issuer => authorized flag
    mapping(address => bool) public authorizedIssuers;

    // ---------------------------------------------------------------------
    // Modifiers
    // ---------------------------------------------------------------------
    modifier onlyOwner() {
        require(msg.sender == owner, 'NOT_OWNER');
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender], 'NOT_ISSUER');
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ---------------------------------------------------------------------
    // Owner Functions
    // ---------------------------------------------------------------------
    /**
     * @notice Authorize or de-authorize an issuer address.
     * @param issuer The address of the institution.
     * @param status True to authorize, false to revoke authorization.
     */
    function setAuthorizer(address issuer, bool status) external onlyOwner {
        authorizedIssuers[issuer] = status;
        emit IssuerAuthorizationChanged(issuer, status, msg.sender);
    }

    /**
     * @notice Transfer contract ownership.
     * @param newOwner The new owner address.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), 'ZERO_ADDR');
        owner = newOwner;
    }

    // ---------------------------------------------------------------------
    // Issuance / Revocation
    // ---------------------------------------------------------------------
    /**
     * @notice Issue a new certificate. certHash should be a collision-resistant hash (e.g. keccak256/sha256) of structured certificate data.
     * @param certHash 32-byte hash representing the certificate.
     * @param student Owner / recipient address.
     */
    function issueCertificate(bytes32 certHash, address student) external onlyAuthorizedIssuer {
        require(student != address(0), 'BAD_STUDENT');
        Certificate storage c = certificates[certHash];
        require(c.issuedAt == 0, 'ALREADY_ISSUED');
        c.issuer = msg.sender;
        c.owner = student;
        c.issuedAt = uint64(block.timestamp);
        emit CertificateIssued(certHash, msg.sender, student, c.issuedAt);
    }

    /**
     * @notice Revoke an existing (non-revoked) certificate.
     * @param certHash Hash of the certificate.
     */
    function revokeCertificate(bytes32 certHash) external onlyAuthorizedIssuer {
        Certificate storage c = certificates[certHash];
        require(c.issuedAt != 0, 'NOT_FOUND');
        require(!c.revoked, 'ALREADY_REVOKED');
        require(c.issuer == msg.sender, 'NOT_ISSUER_OF_CERT');
        c.revoked = true;
        c.revokedAt = uint64(block.timestamp);
        emit CertificateRevoked(certHash, msg.sender, c.revokedAt);
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------
    /**
     * @notice Verify a certificate hash.
     * @param certHash Hash of the certificate.
     * @return valid True if issued and not revoked.
     * @return issuer Issuer address (0 if not issued).
     * @return owner_ Owner/student address.
     * @return issuedAt Timestamp when issued.
     * @return revoked Whether revoked.
     * @return revokedAt Timestamp of revocation or 0.
     */
    function verifyCertificate(bytes32 certHash)
        external
        view
        returns (
            bool valid,
            address issuer,
            address owner_,
            uint64 issuedAt,
            bool revoked,
            uint64 revokedAt
        )
    {
        Certificate storage c = certificates[certHash];
        if (c.issuedAt == 0) {
            return (false, address(0), address(0), 0, false, 0);
        }
        bool isValid = !c.revoked;
        return (isValid, c.issuer, c.owner, c.issuedAt, c.revoked, c.revokedAt);
    }

    /**
     * @notice Return full struct (helper for off-chain indexing / debugging).
     */
    function getCertificate(bytes32 certHash) external view returns (Certificate memory) {
        return certificates[certHash];
    }
}
