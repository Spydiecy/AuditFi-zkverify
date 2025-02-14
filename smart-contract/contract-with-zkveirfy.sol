// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IZKVerify {
    function verifyProofAttestation(
        uint256 _attestationId,
        bytes32 _leaf,
        bytes calldata _merklePath,
        uint32 _number_of_leaves,
        uint256 _index
    ) external view returns (bool);
}

contract AuditRegistry {
    // ZKVerify contract reference - EDU Chain Testnet address
    IZKVerify public zkVerifyContract = IZKVerify(0x147AD899D1773f5De5e064C33088b58c7acb7acf);
    
    struct Audit {
        uint8 stars;          // 0-5 stars
        string summary;       // Brief summary of findings
        address auditor;      // Address of the auditor
        uint256 timestamp;    // When the audit was conducted
        bytes32 proofHash;    // Hash of the zkVerify proof
        uint256 attestationId; // zkVerify attestation ID
    }
    
    // Mapping from contract hash to array of audits
    mapping(bytes32 => Audit[]) public contractAudits;
    
    // Mapping from auditor to array of contract hashes they've audited
    mapping(address => bytes32[]) public auditorHistory;
    
    // Array to store all contract hashes
    bytes32[] public allContractHashes;
    
    // Mapping to track if a contract hash exists
    mapping(bytes32 => bool) private hashExists;
    
    // Contract owner
    address public owner;
    
    event AuditRegistered(
        bytes32 indexed contractHash,
        uint8 stars,
        string summary,
        address indexed auditor,
        uint256 timestamp,
        bytes32 proofHash,
        uint256 attestationId
    );
    
    constructor() {
        owner = msg.sender;
    }
    
    function registerAudit(
        bytes32 contractHash,
        uint8 stars,
        string calldata summary,
        bytes32 proofLeaf,
        uint256 attestationId,
        bytes calldata merklePath,
        uint32 numberOfLeaves,
        uint256 index
    ) external {
        require(stars <= 5, "Stars must be between 0 and 5");
        require(bytes(summary).length > 0, "Summary cannot be empty");
        require(bytes(summary).length <= 500, "Summary too long");
        
        // Verify the audit proof through zkVerify
        require(
            zkVerifyContract.verifyProofAttestation(
                attestationId,
                proofLeaf,
                merklePath,
                numberOfLeaves,
                index
            ),
            "Invalid ZK proof attestation"
        );
        
        Audit memory newAudit = Audit({
            stars: stars,
            summary: summary,
            auditor: msg.sender,
            timestamp: block.timestamp,
            proofHash: proofLeaf,
            attestationId: attestationId
        });
        
        contractAudits[contractHash].push(newAudit);
        
        if (!hashExists[contractHash]) {
            hashExists[contractHash] = true;
            allContractHashes.push(contractHash);
        }
        
        bool isNewContract = true;
        bytes32[] storage auditedContracts = auditorHistory[msg.sender];
        for (uint i = 0; i < auditedContracts.length; i++) {
            if (auditedContracts[i] == contractHash) {
                isNewContract = false;
                break;
            }
        }
        if (isNewContract) {
            auditorHistory[msg.sender].push(contractHash);
        }
        
        emit AuditRegistered(
            contractHash,
            stars,
            summary,
            msg.sender,
            block.timestamp,
            proofLeaf,
            attestationId
        );
    }
    
    function getAllAudits(uint256 startIndex, uint256 limit) 
        external 
        view 
        returns (
            bytes32[] memory contractHashes,
            uint8[] memory stars,
            string[] memory summaries,
            address[] memory auditors,
            uint256[] memory timestamps,
            bytes32[] memory proofHashes,
            uint256[] memory attestationIds
        ) 
    {
        uint256 totalHashes = allContractHashes.length;
        require(startIndex < totalHashes, "Start index out of bounds");
        
        uint256 actualLimit = limit;
        if (startIndex + limit > totalHashes) {
            actualLimit = totalHashes - startIndex;
        }
        
        contractHashes = new bytes32[](actualLimit);
        stars = new uint8[](actualLimit);
        summaries = new string[](actualLimit);
        auditors = new address[](actualLimit);
        timestamps = new uint256[](actualLimit);
        proofHashes = new bytes32[](actualLimit);
        attestationIds = new uint256[](actualLimit);
        
        for (uint256 i = 0; i < actualLimit; i++) {
            bytes32 hash = allContractHashes[startIndex + i];
            Audit[] storage audits = contractAudits[hash];
            if (audits.length > 0) {
                Audit storage latestAudit = audits[audits.length - 1];
                contractHashes[i] = hash;
                stars[i] = latestAudit.stars;
                summaries[i] = latestAudit.summary;
                auditors[i] = latestAudit.auditor;
                timestamps[i] = latestAudit.timestamp;
                proofHashes[i] = latestAudit.proofHash;
                attestationIds[i] = latestAudit.attestationId;
            }
        }
    }
    
    function getTotalContracts() external view returns (uint256) {
        return allContractHashes.length;
    }
    
    function getContractAudits(bytes32 contractHash) 
        external 
        view 
        returns (Audit[] memory) 
    {
        return contractAudits[contractHash];
    }
    
    function getAuditorHistory(address auditor) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        return auditorHistory[auditor];
    }
    
    function getLatestAudit(bytes32 contractHash) 
        external 
        view 
        returns (Audit memory) 
    {
        Audit[] storage audits = contractAudits[contractHash];
        require(audits.length > 0, "No audits found for this contract");
        return audits[audits.length - 1];
    }

    // Admin function to update zkVerify contract address if needed
    function updateZkVerifyContract(address _newAddress) external {
        require(msg.sender == owner, "Only owner can update zkVerify contract");
        zkVerifyContract = IZKVerify(_newAddress);
    }
    
    function withdraw() external {
        require(msg.sender == owner, "Only owner can withdraw");
        payable(owner).transfer(address(this).balance);
    }
}