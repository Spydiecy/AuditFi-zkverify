// src/utils/zkVerify.ts

import { zkVerifySession } from 'zkverifyjs';
import { ethers } from 'ethers';

export interface ZKProofResult {
    proofHash: string;
    attestationId: number;
    merklePath: string;
    numberOfLeaves: number;
    index: number;
}

export interface AnalysisResult {
    stars: number;
    summary: string;
    vulnerabilities: {
        critical: string[];
        high: string[];
        medium: string[];
        low: string[];
    };
}

export async function submitZKProof(
    contractCode: string,
    analysis: AnalysisResult
): Promise<ZKProofResult> {
    // Check if window.ethereum exists
    if (!window.ethereum) {
        throw new Error('Ethereum provider not found');
    }

    // Start zkVerify session on testnet
    const session = await zkVerifySession.start()
        .Testnet()
        .withWallet({
            source: window.ethereum,
            accountAddress: (await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[])[0]
        });

    try {
        // Convert audit analysis to proof inputs
        const proofInputs = await generateProofInputs(contractCode, analysis);
        
        // Submit proof and wait for attestation
        const { events, transactionResult } = await session.submit()
            .fflonk() // Using fflonk verifier for audit proofs
            .waitForPublishedAttestation()
            .execute({
                proofData: {
                    vk: proofInputs.vk,
                    proof: proofInputs.proof,
                    publicSignals: proofInputs.publicSignals
                }
            });

        // Listen for attestation confirmation with typed eventData
        events.on('attestationConfirmed', (eventData: { attestationId: number }) => {
            console.log('Attestation confirmed:', eventData);
        });

        const txInfo = await transactionResult;
        
        return {
            proofHash: txInfo.proofHash,
            attestationId: txInfo.attestationId,
            merklePath: txInfo.merklePath,
            numberOfLeaves: txInfo.numberOfLeaves,
            index: txInfo.index
        };
    } finally {
        await session.end();
    }
}

// Helper function to generate proof inputs from contract code and analysis
async function generateProofInputs(contractCode: string, analysis: AnalysisResult) {
    const contractHash = ethers.keccak256(ethers.toUtf8Bytes(contractCode));
    
    // Convert analysis to bytes for public signals
    const analysisString = JSON.stringify({
        stars: analysis.stars,
        summary: analysis.summary,
        vulnerabilities: analysis.vulnerabilities
    });
    
    const analysisHash = ethers.keccak256(ethers.toUtf8Bytes(analysisString));
    
    // Combine contract hash and analysis hash for proof
    const combinedHash = ethers.keccak256(
        ethers.concat([
            ethers.toUtf8Bytes(contractHash),
            ethers.toUtf8Bytes(analysisHash)
        ])
    );

    // Return proof inputs required by zkVerify
    return {
        vk: "0x147AD899D1773f5De5e064C33088b58c7acb7acf", // EDU Chain zkVerify contract address
        proof: combinedHash,
        publicSignals: analysisHash
    };
}