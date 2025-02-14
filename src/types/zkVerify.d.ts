// src/types/zkVerify.d.ts

declare module 'zkverifyjs' {
    export interface ZkVerifyEvents {
        includedInBlock: string;
        finalized: string;
        attestationConfirmed: string;
        error: Error;
    }

    export interface ProofData {
        vk: string;
        proof: string;
        publicSignals: string;
    }

    export interface TransactionInfo {
        proofHash: string;
        attestationId: number;
        merklePath: string;
        numberOfLeaves: number;
        index: number;
        attestationConfirmed: boolean;
        attestationEvent?: any;
    }

    export interface ZkVerifySession {
        start(): ZkVerifySessionBuilder;
        close(): Promise<void>;
    }

    export interface ZkVerifySessionBuilder {
        Testnet(): ZkVerifySessionBuilder;
        Custom(url: string): ZkVerifySessionBuilder;
        withWallet(options: {
            source: any;
            accountAddress: string;
        }): ZkVerifySessionBuilder;
        withAccount(seedPhrase?: string): ZkVerifySessionBuilder;
    }

    export interface VerificationBuilder {
        fflonk(): VerificationBuilder;
        waitForPublishedAttestation(): VerificationBuilder;
        execute(options: { proofData: ProofData }): Promise<{
            events: EventEmitter;
            transactionResult: Promise<TransactionInfo>;
        }>;
    }

    export const zkVerifySession: ZkVerifySession;
}