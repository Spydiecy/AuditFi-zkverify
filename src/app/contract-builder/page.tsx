"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ethers } from 'ethers';
import { 
  FileCode,
  Robot,
  CircleNotch,
  Copy,
  Check,
  Rocket,
  Link
} from 'phosphor-react';
import { CONTRACT_TEMPLATES, ContractTemplate } from './templates';
import { connectWallet, switchNetwork, CHAIN_CONFIG } from '@/utils/web3';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export default function ContractBuilder() {
  // Template and code generation state
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [customFeatures, setCustomFeatures] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractParams, setContractParams] = useState<Record<string, string>>({});
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Deployment state
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [currentChain, setCurrentChain] = useState<keyof typeof CHAIN_CONFIG | null>(null);
  const [deploymentError, setDeploymentError] = useState<string | null>(null);

  // Check for existing wallet connection on mount
  useEffect(() => {
    const checkWallet = async () => {
      if (window.ethereum && (await (window.ethereum.request({ method: 'eth_accounts' }) as Promise<string[]>)).length > 0) {
        try {
          const { provider } = await connectWallet();
          const network = await provider.getNetwork();
          const chainId = '0x' + network.chainId.toString(16);
          
          const matchingChain = Object.entries(CHAIN_CONFIG).find(
            ([_, config]) => config.chainId === chainId
          );
          
          if (matchingChain) {
            setCurrentChain(matchingChain[0] as keyof typeof CHAIN_CONFIG);
          }
          
          setWalletConnected(true);
        } catch (error) {
          console.error('Error checking wallet:', error);
        }
      }
    };
    
    checkWallet();
  }, []);

  // Update contract parameters when template changes
  useEffect(() => {
    if (selectedTemplate?.defaultParams) {
      setContractParams(selectedTemplate.defaultParams);
      setGeneratedCode(selectedTemplate.baseCode);
    } else {
      setContractParams({});
      setGeneratedCode('');
    }
  }, [selectedTemplate]);

  // Track mouse position for gradient effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Generate contract code using Gemini API
  const generateContract = async () => {
    if (!selectedTemplate) return;
    setIsGenerating(true);
    setError(null);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const prompt = `You are an expert Solidity developer. Generate a secure and optimized smart contract based on these requirements:

      Template: ${selectedTemplate.name}
      Base Code: ${selectedTemplate.baseCode || 'Create new contract'}
      Custom Features: ${customFeatures || 'Standard features'}
      Parameters: ${JSON.stringify(contractParams)}

      Requirements:
      1. Use Solidity version 0.8.19
      2. Include no comments in the code
      3. No OpenZeppelin imports should be used
      4. Add proper access control and safety checks
      5. Include events for all important state changes
      6. Add gas optimizations
      7. Must be fully deployable
      8. Include clear error messages

      ${customFeatures ? `Additional Features to implement:
      ${customFeatures}` : ''}

      Important:
      - Keep the core functionality of the base template
      - Add requested custom features seamlessly
      - Ensure no OpenZeppelin imports are used
      - Add proper events for new features
      - Include input validation
      - Add clear error messages
      - Follow security best practices

      Return ONLY the complete contract code without any extra text or markdown.`;

      const result = await model.generateContent(prompt);
      const cleanCode = result.response.text()
        .replace(/```solidity\n/g, '')
        .replace(/```\n/g, '')
        .replace(/```/g, '')
        .trim();
      
      setGeneratedCode(cleanCode);
    } catch (error) {
      console.error('Generation failed:', error);
      setError('Failed to generate contract. Please try again.');
      if (selectedTemplate.baseCode) {
        setGeneratedCode(selectedTemplate.baseCode);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Deploy the generated contract
  const deployContract = async () => {
    if (!generatedCode || !walletConnected) return;
    
    setIsDeploying(true);
    setDeploymentError(null);
    
    try {
        console.log('Starting deployment process...');
        const { provider, signer } = await connectWallet();
        console.log('Wallet connected, preparing to compile contract...');
        
        // First, let's log the contract code we're trying to compile
        console.log('Contract code:', generatedCode);

        // Compile contract with better error handling
        let compilationResponse;
        try {
            console.log('Sending contract to compiler...');
            const response = await fetch('/api/compile-contract', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sourceCode: generatedCode,
                }),
            });

            // Get the raw text response first
            const responseText = await response.text();
            console.log('Raw compiler response:', responseText);

            // Try to parse it as JSON
            try {
                compilationResponse = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse compiler response:', parseError);
                throw new Error(`Invalid compiler response: ${responseText.substring(0, 200)}...`);
            }

            // Check for compilation errors
            if (!response.ok) {
                const errorDetails = compilationResponse.details 
                    ? (Array.isArray(compilationResponse.details) 
                        ? compilationResponse.details.join('\n') 
                        : compilationResponse.details)
                    : compilationResponse.error || 'Unknown compilation error';
                throw new Error(`Compilation failed: ${errorDetails}`);
            }

            // Validate compilation response
            if (!compilationResponse.abi || !compilationResponse.bytecode) {
                throw new Error('Compiler response missing ABI or bytecode');
            }

        } catch (compilationError) {
            console.error('Contract compilation failed:', compilationError);
            if (compilationError instanceof Error) {
              throw new Error(`Contract compilation error: ${compilationError.message}`);
            } else {
              throw new Error('Contract compilation error: Unknown error');
            }
        }

        // Extract ABI and bytecode
        const { abi, bytecode } = compilationResponse;
        console.log('Contract compiled successfully');
        console.log('ABI:', abi);

        // Create contract factory
        console.log('Creating contract factory...');
        const contractFactory = new ethers.ContractFactory(
            abi,
            bytecode,
            signer
        );

        // Process constructor arguments
        const constructorAbi = abi.find((item: any) => item.type === 'constructor');
        const constructorArgs = Object.values(contractParams).map((value, index) => {
            const input = constructorAbi?.inputs?.[index];
            console.log(`Processing constructor argument ${index}:`, {
                value,
                type: input?.type,
                name: input?.name
            });

            if (!input) return value;

            switch (input.type) {
                case 'uint256':
                    return ethers.parseUnits(value.toString(), 18);
                case 'address':
                    if (!ethers.isAddress(value)) {
                        throw new Error(`Invalid address for parameter ${input.name}`);
                    }
                    return value;
                default:
                    return value;
            }
        });

        console.log('Deploying contract with args:', constructorArgs);
        const contract = await contractFactory.deploy(...constructorArgs);
        
        console.log('Waiting for deployment transaction...');
        const deploymentTx = contract.deploymentTransaction();
        if (!deploymentTx) {
            throw new Error('Deployment transaction failed to create');
        }

        const deploymentReceipt = await deploymentTx.wait();
        
        if (!deploymentReceipt?.contractAddress) {
            throw new Error('Failed to get contract address from receipt');
        }

        console.log('Contract deployed successfully:', deploymentReceipt.contractAddress);
        setDeployedAddress(deploymentReceipt.contractAddress);

    } catch (error: any) {
        console.error('Deployment failed:', error);
        setDeploymentError(error.message || 'Unknown deployment error');
    } finally {
        setIsDeploying(false);
    }
};

  // Get block explorer URL for deployed contract
  const getExplorerUrl = () => {
    if (!currentChain || !deployedAddress) return null;
    const baseUrl = CHAIN_CONFIG[currentChain].blockExplorerUrls[0];
    return `${baseUrl}/address/${deployedAddress}`;
  };

  // Handle wallet connection
  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      setWalletConnected(true);
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Copy code to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen py-12 bg-gray-900">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-mono font-bold mb-4 text-white">Smart Contract Builder</h1>
          <p className="text-gray-400">Generate and deploy secure smart contracts with AI assistance</p>
          
          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 rounded-lg"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Deployment Success Message */}
          {deployedAddress && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-3 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold mb-1">Contract deployed successfully!</p>
                  <p className="text-sm font-mono">{deployedAddress}</p>
                </div>
                <a
                  href={getExplorerUrl() || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-green-400 hover:text-green-300"
                >
                  <Link size={20} />
                  View on Explorer
                </a>
              </div>
            </motion.div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Templates and Parameters */}
          <div className="flex flex-col space-y-4">
            {/* Template Selection */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Robot className="text-green-400" size={20} />
                <span className="font-mono text-white">Contract Templates</span>
              </div>
              
              <div className="space-y-4">
                {CONTRACT_TEMPLATES.map((template) => (
                  <button
                    key={template.name}
                    onClick={() => setSelectedTemplate(template)}
                    className={`w-full p-4 rounded-lg border transition-colors duration-200 text-left
                      ${selectedTemplate?.name === template.name
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-gray-700 hover:border-green-500/50'}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-green-400">{template.icon}</div>
                      <span className="font-semibold text-white">{template.name}</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{template.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {template.features.map((feature) => (
                        <span
                          key={feature}
                          className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Parameters Form */}
            {selectedTemplate && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-mono text-white mb-4">Contract Parameters</h3>
                {Object.entries(contractParams).map(([key, value]) => (
                  <div key={key} className="mb-4">
                    <label className="text-sm text-gray-400 mb-1 block">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setContractParams(prev => ({
                        ...prev,
                        [key]: e.target.value
                      }))}
                      className="w-full bg-gray-700 rounded-lg border border-gray-600 p-2 text-white"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Custom Features
                  </label>
                  <textarea
                    value={customFeatures}
                    onChange={(e) => setCustomFeatures(e.target.value)}
                    placeholder="Describe additional features..."
                    className="w-full h-24 bg-gray-700 rounded-lg border border-gray-600 p-2 text-white"
                  />
                </div>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={generateContract}
              disabled={!selectedTemplate || isGenerating}
              className={`w-full py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors duration-200 
                ${isGenerating || !selectedTemplate
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-black'}`}
            >
              {isGenerating ? (
                <>
                  <CircleNotch className="animate-spin" size={20} />
                  Generating...
                </>
              ) : (
                <>
                  <Robot size={20} />
                  Generate Contract
                </>
              )}
            </button>
          </div>

          {/* Right Column - Code Display and Deployment */}
          <div className="bg-gray-800 rounded-lg flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileCode className="text-green-400" size={20} />
                <span className="font-mono text-white">Generated Contract</span>
              </div>
              {generatedCode && (
                <button
                  onClick={() => copyToClipboard(generatedCode)}
                  className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1"
                >
                  {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                  {copySuccess ? 'Copied!' : 'Copy Code'}
                </button>
              )}
            </div>

            {/* Code Display */}
            <div className="flex-1 overflow-auto p-4">
              {generatedCode ? (
                <pre className="font-mono text-sm text-white whitespace-pre-wrap">
                  {generatedCode}
                </pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Robot size={48} className="mb-4" />
                  <p>Select a template and generate your contract to see the code here</p>
                </div>
              )}
            </div>

            {/* Deployment Section */}
            {generatedCode && (
              <div className="border-t border-gray-700 p-4">
                {/* Deployment Controls */}
                {!walletConnected ? (
                  <button
                    onClick={handleConnectWallet}
                    className="w-full py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-black transition-colors duration-200"
                  >
                    <Robot size={20} />
                    Connect Wallet to Deploy
                  </button>
                ) : (
                  <div className="space-y-4">
                    {currentChain && (
                      <div className="text-sm text-gray-400 flex items-center gap-2">
                        <span>Connected to:</span>
                        <span className="text-white font-mono">{CHAIN_CONFIG[currentChain].chainName}</span>
                      </div>
                    )}
                    
                    <button
                      onClick={deployContract}
                      disabled={isDeploying}
                      className={`w-full py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors duration-200 
                        ${isDeploying 
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-green-500 hover:bg-green-600 text-black'}`}
                    >
                      {isDeploying ? (
                        <>
                          <CircleNotch className="animate-spin" size={20} />
                          Deploying Contract...
                        </>
                      ) : (
                        <>
                          <Rocket size={20} />
                          Deploy Contract
                        </>
                      )}
                    </button>

                    {/* Deployment Error Display */}
                    {deploymentError && (
                      <div className="mt-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        {deploymentError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}