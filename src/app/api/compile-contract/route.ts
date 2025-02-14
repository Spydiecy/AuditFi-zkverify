import { NextResponse } from 'next/server';
import solc from 'solc';
import fs from 'fs';
import path from 'path';

// This function helps resolve imported contracts, particularly from OpenZeppelin
function findImports(importPath: string) {
    try {
        // Convert @openzeppelin imports to node_modules path
        if (importPath.startsWith('@openzeppelin/')) {
            const npmPath = path.join(process.cwd(), 'node_modules', importPath);
            if (!fs.existsSync(npmPath)) {
                console.error('Import not found:', npmPath);
                return { error: `File not found: ${importPath}` };
            }
            const content = fs.readFileSync(npmPath, 'utf8');
            return { contents: content };
        }
        return { error: `Unsupported import: ${importPath}` };
    } catch (error) {
        console.error('Import error:', error);
        return { error: `Import failed: ${(error as Error).message}` };
    }
}

export async function POST(request: Request) {
    try {
        // Safely parse the request body
        let sourceCode;
        try {
            const body = await request.json();
            sourceCode = body.sourceCode;
            
            if (!sourceCode) {
                return NextResponse.json({
                    error: 'No source code provided'
                }, { status: 400 });
            }
        } catch (error) {
            return NextResponse.json({
                error: 'Invalid request body',
                details: (error as Error).message
            }, { status: 400 });
        }

        // Prepare compiler input with explicit versioning
        const input = {
            language: 'Solidity',
            sources: {
                'contract.sol': {
                    content: sourceCode
                }
            },
            settings: {
                outputSelection: {
                    '*': {
                        '*': ['abi', 'evm.bytecode']
                    }
                },
                optimizer: {
                    enabled: true,
                    runs: 200
                }
            }
        };

        // Compile with error catching
        let output;
        try {
            const compiledOutput = solc.compile(JSON.stringify(input), { import: findImports });
            output = JSON.parse(compiledOutput);
        } catch (error) {
            console.error('Compilation error:', error);
            return NextResponse.json({
                error: 'Compilation process failed',
                details: (error as Error).message
            }, { status: 500 });
        }

        // Check for compilation errors
        if (output.errors) {
            const errors = output.errors.filter((e: { severity: string }) => e.severity === 'error');
            if (errors.length > 0) {
                return NextResponse.json({
                    error: 'Compilation errors found',
                    details: errors.map((e: { formattedMessage: string }) => e.formattedMessage)
                }, { status: 400 });
            }
        }

        // Validate compilation output
        if (!output.contracts || !output.contracts['contract.sol']) {
            return NextResponse.json({
                error: 'Invalid compilation output',
                details: 'No contracts found in output'
            }, { status: 400 });
        }

        // Get the contract from the output
        const contractName = Object.keys(output.contracts['contract.sol'])[0];
        const contract = output.contracts['contract.sol'][contractName];

        // Final validation of contract data
        if (!contract || !contract.abi || !contract.evm || !contract.evm.bytecode) {
            return NextResponse.json({
                error: 'Invalid contract output',
                details: 'Missing required contract data'
            }, { status: 400 });
        }

        // Return successful response
        return NextResponse.json({
            abi: contract.abi,
            bytecode: '0x' + contract.evm.bytecode.object
        });

    } catch (error) {
        // Catch any unexpected errors
        console.error('Unexpected error in compilation route:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: (error as Error).message
        }, { status: 500 });
    }
}