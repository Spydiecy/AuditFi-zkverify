'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ethers } from 'ethers';
import { 
  Star,
  Warning,
  CheckCircle,
  FileCode,
  Robot,
  Cube,
  Lock,
  Timer,
  CircleNotch,
  ArrowSquareOut
} from 'phosphor-react';
import { connectWallet } from '@/utils/web3';
import { CONTRACT_ADDRESSES, AUDIT_REGISTRY_ABI } from '@/utils/contracts';
import { CHAIN_CONFIG } from '@/utils/web3';

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

// Interfaces
interface AuditResult {
  stars: number;
  summary: string;
  vulnerabilities: {
    critical: string[];
    high: string[];
    medium: string[];
    low: string[];
  };
  recommendations: string[];
  gasOptimizations: string[];
}

interface SeverityConfig {
  color: string;
  label: string;
}

interface TransactionState {
  isProcessing: boolean;
  hash: string | null;
  error: string | null;
}

interface RawVulnerabilities {
  critical?: unknown[];
  high?: unknown[];
  medium?: unknown[];
  low?: unknown[];
}

interface RawAuditResponse {
  stars?: unknown;
  summary?: unknown;
  vulnerabilities?: RawVulnerabilities;
  recommendations?: unknown[];
  gasOptimizations?: unknown[];
}

// Constants
const COOLDOWN_TIME = 30;
const SEVERITY_CONFIGS: Record<string, SeverityConfig> = {
  critical: { color: 'text-red-500', label: 'Critical' },
  high: { color: 'text-orange-500', label: 'High Risk' },
  medium: { color: 'text-yellow-500', label: 'Medium Risk' },
  low: { color: 'text-blue-500', label: 'Low Risk' }
};

// Response sanitizer
const sanitizeResponse = (response: RawAuditResponse): AuditResult => {
  const ensureStringArray = (arr: unknown[] | undefined): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr.map(item => String(item)).filter(item => item.length > 0);
  };

  const vulnerabilities = {
    critical: ensureStringArray(response?.vulnerabilities?.critical),
    high: ensureStringArray(response?.vulnerabilities?.high),
    medium: ensureStringArray(response?.vulnerabilities?.medium),
    low: ensureStringArray(response?.vulnerabilities?.low)
  };

  return {
    stars: Math.min(Math.max(Number(response?.stars) || 0, 0), 5),
    summary: String(response?.summary || 'Analysis completed.'),
    vulnerabilities,
    recommendations: ensureStringArray(response?.recommendations),
    gasOptimizations: ensureStringArray(response?.gasOptimizations)
  };
};

export default function AuditPage() {
  // State management
  const [code, setCode] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);
  const [isReviewBlurred, setIsReviewBlurred] = useState(true);
  const [currentChain, setCurrentChain] = useState<keyof typeof CHAIN_CONFIG>('lineaSepolia');
  const [txState, setTxState] = useState<TransactionState>({
    isProcessing: false,
    hash: null,
    error: null
  });

  // Mouse tracking effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Cooldown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

// Validation functions
const isSolidityCode = (code: string): boolean => {
    const hasPragma = /pragma\s+solidity\s+[\^]?\d+\.\d+\.\d+/.test(code);
    const hasContract = /contract\s+\w+/.test(code);
    return hasPragma && hasContract;
  };

  // Chain registration function
  const registerAuditOnChain = async () => {
    if (!result || !code) return;

  setTxState({ isProcessing: true, hash: null, error: null });

  try {
    const { provider, signer } = await connectWallet();
    
    // Calculate contract hash
    const contractHash = ethers.keccak256(
      ethers.toUtf8Bytes(code)
    );

    // Get current chain ID
    const network = await provider.getNetwork();
    const chainId = '0x' + network.chainId.toString(16);
    
    // Determine contract address and update current chain
    let contractAddress = '';   setCurrentChain('lineaSepolia');
    if (chainId.toLowerCase() === CHAIN_CONFIG.educhainTestnet.chainId.toLowerCase()) {
      contractAddress = CONTRACT_ADDRESSES.educhainTestnet;
      setCurrentChain('educhainTestnet');
    } else {
      throw new Error('Please switch to any supported networks to register audits');
    }

      const contract = new ethers.Contract(
        contractAddress,
        AUDIT_REGISTRY_ABI,
        signer
      );

      const tx = await contract.registerAudit(
        contractHash,
        result.stars,
        result.summary
      );

      const receipt = await tx.wait();
      setTxState({
        isProcessing: false,
        hash: receipt.transactionHash,
        error: null
      });
      setIsReviewBlurred(false);
    } catch (error) {
      console.error('Failed to register audit:', error);
      setTxState({
        isProcessing: false,
        hash: null,
        error: (error instanceof Error) ? error.message : 'Failed to register audit'
      });
    }
  };

  // Main analysis function
  const analyzeContract = async () => {
    if (!code.trim()) {
      setError('Please enter your smart contract code.');
      return;
    }

    if (!isSolidityCode(code)) {
      setError('Invalid input. Please ensure your code is a valid Solidity smart contract (must include pragma directive and contract declaration).');
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setIsReviewBlurred(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      const prompt = `You are a professional smart contract security auditor. Your task is to analyze the provided Solidity smart contract with zero tolerance for security issues.

      Rating System (Extremely Strict):
      - 5 stars: ONLY if the contract has absolutely zero vulnerabilities of any kind, implements all security best practices, has optimal gas usage, and uses the latest Solidity features securely.
      
      - 4 stars: ONLY if the contract has no critical or high vulnerabilities, maximum of 1-2 medium issues that are not easily exploitable, and follows most security best practices.
      
      - 3 stars: If there are no critical vulnerabilities but has high severity issues that need immediate attention, or multiple medium severity issues.
      
      - 2 stars: If there is even one critical vulnerability or multiple high severity issues that make the contract unsafe for production.
      
      - 1 star: Multiple critical and high severity vulnerabilities that make the contract extremely unsafe.
      
      - 0 stars: Fundamental security flaws that make the contract completely unsafe and exploitable.

      Critical Issues (Any one of these automatically reduces rating to 2 or lower):
      - Reentrancy vulnerabilities
      - Unchecked external calls
      - Integer overflow/underflow risks
      - Access control flaws
      - Unprotected selfdestruct
      - Timestamp manipulation risks
      - Missing input validation
      - Unprotected critical functions

      High Severity Issues (Any one of these prevents 5-star rating):
      - Missing event emissions
      - Unoptimized gas usage
      - Inadequate error handling
      - State variable shadowing
      - Complex fallback functions
      - Implicit visibility levels

      Provide your response in this exact JSON format:
      {
        "stars": number (default to lowest rating if in doubt),
        "summary": "Detailed explanation of the rating and major concerns",
        "vulnerabilities": {
          "critical": ["Detailed explanation of each critical vulnerability"],
          "high": ["Detailed explanation of each high severity issue"],
          "medium": ["Detailed explanation of each medium severity issue"],
          "low": ["Detailed explanation of each low severity issue"]
        },
        "recommendations": [
          "Specific, actionable recommendation with code example"
        ],
        "gasOptimizations": [
          "Specific gas optimization with estimated savings"
        ]
      }

      Contract to analyze:
      ${code}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Parse and sanitize response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch {
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                         responseText.match(/```\s*([\s\S]*?)\s*```/) ||
                         responseText.match(/({[\s\S]*})/);
                         
        if (jsonMatch) {
          try {
            parsedResponse = JSON.parse(jsonMatch[1]);
          } catch {
            throw new Error('Failed to parse AI response as JSON');
          }
        } else {
          throw new Error('Could not find valid JSON in AI response');
        }
      }

      const sanitizedResponse = sanitizeResponse(parsedResponse);

      // Enforce strict rating based on vulnerabilities
      if (sanitizedResponse.vulnerabilities.critical.length > 0) {
        sanitizedResponse.stars = Math.min(sanitizedResponse.stars, 2);
      }
      if (sanitizedResponse.vulnerabilities.high.length > 0) {
        sanitizedResponse.stars = Math.min(sanitizedResponse.stars, 3);
      }
      if (sanitizedResponse.vulnerabilities.critical.length > 2) {
        sanitizedResponse.stars = 0;
      }
      
      setResult(sanitizedResponse);
      setShowResult(true);
      setCooldown(COOLDOWN_TIME);
    } catch (error) {
      console.error('Analysis failed:', error);
      setError('Analysis failed. Please try again in a few moments.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-mono font-bold mb-4">Smart Contract Audit</h1>
          <p className="text-gray-400">Get instant AI-powered security analysis for your smart contracts</p>
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
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Code Input Panel */}
          <div className="h-[700px] flex flex-col">
            <div 
              className="relative flex-1 bg-gray-900/50 rounded-lg border border-gray-800 hover-gradient-effect"
              style={{
                '--mouse-x': `${mousePosition.x}px`,
                '--mouse-y': `${mousePosition.y}px`
              } as React.CSSProperties}
            >
              <div className="absolute inset-0">
                <div className="p-4 border-b border-gray-800 flex items-center gap-2">
                  <FileCode className="text-emerald-400" size={20} />
                  <span className="font-mono">Solidity Code</span>
                </div>
                <div className="h-[calc(100%-60px)] custom-scrollbar">
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="// Paste your Solidity code here..."
                    className="w-full h-full p-4 bg-transparent font-mono text-sm focus:outline-none resize-none code-editor"
                    spellCheck="false"
                    disabled={isAnalyzing}
                  />
                </div>
              </div>

              {/* Cooldown Overlay */}
              <AnimatePresence>
                {cooldown > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center"
                  >
                    <Lock className="text-emerald-400 mb-4" size={32} weight="bold" />
                    <div className="text-2xl font-mono mb-2">Cooldown</div>
                    <div className="flex items-center gap-2">
                      <Timer className="text-emerald-400" size={20} />
                      <span className="text-xl">{cooldown}s</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={analyzeContract}
              disabled={isAnalyzing || !code || cooldown > 0}
              className={`mt-4 w-full py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
                isAnalyzing || !code || cooldown > 0
                  ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-black hover-gradient-effect'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <CircleNotch className="animate-spin" size={20} />
                  Analyzing...
                </>
              ) : (
                <>
                  <Robot size={20} />
                  Analyze Contract
                </>
              )}
            </button>
          </div>

          {/* Results Panel */}
          <div className="h-[700px]">
            {result && showResult ? (
              <div 
                className="h-full bg-gray-900/50 rounded-lg border border-gray-800 hover-gradient-effect relative"
                style={{
                  '--mouse-x': `${mousePosition.x}px`,
                  '--mouse-y': `${mousePosition.y}px`
                } as React.CSSProperties}
              >
                <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                  <span className="font-mono">Analysis Results</span>
                  {txState.hash && (
                    <a 
                        href={`${CHAIN_CONFIG[currentChain].blockExplorerUrls[0]}/tx/${txState.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-1"
                    >
                        View Transaction <ArrowSquareOut size={16} />
                    </a>
                    )}
                </div>

                <div className={`h-[calc(100%-60px)] custom-scrollbar overflow-auto p-6 transition-all duration-300 ${isReviewBlurred ? 'blur-md select-none' : ''}`}>
                  {/* Results Content */}
                  {/* Rating */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          weight={i < result.stars ? "fill" : "regular"}
                          className={i < result.stars ? "text-emerald-400" : "text-gray-600"}
                          size={24}
                        />
                      ))}
                    </div>
                    <span className="text-gray-400">Security Score</span>
                  </div>

                  {/* Summary */}
                  <div className="mb-6">
                    <h3 className="font-mono text-sm text-gray-400 mb-2">SUMMARY</h3>
                    <p className="text-white">{result.summary}</p>
                  </div>

                  {/* Vulnerabilities */}
                  <div className="mb-6 space-y-4">
                    <h3 className="font-mono text-sm text-gray-400 mb-2">VULNERABILITIES</h3>
                    {Object.entries(result.vulnerabilities).map(([severity, issues]) => {
                      if (issues.length === 0) return null;
                      const config = SEVERITY_CONFIGS[severity];
                      return (
                        <div key={severity} className="bg-gray-800/50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Warning className={config.color} size={20} />
                            <span className="font-semibold">{config.label}</span>
                          </div>
                          <ul className="space-y-2">
                            {issues.map((issue, index) => (
                              <li key={index} className="text-gray-400 text-sm">
                                • {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>

                  {/* Recommendations */}
                  <div className="mb-6">
                    <h3 className="font-mono text-sm text-gray-400 mb-2">RECOMMENDATIONS</h3>
                    <ul className="space-y-2">
                      {result.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="text-emerald-400 mt-1 flex-shrink-0" size={16} />
                          <span className="text-gray-300">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Gas Optimizations */}
                  <div className="mb-6">
                    <h3 className="font-mono text-sm text-gray-400 mb-2">GAS OPTIMIZATIONS</h3>
                    <ul className="space-y-2">
                      {result.gasOptimizations.map((opt, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Cube className="text-emerald-400 mt-1 flex-shrink-0" size={16} />
                          <span className="text-gray-300">{opt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Register Audit Button Overlay */}
                {isReviewBlurred && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={registerAuditOnChain}
                      disabled={txState.isProcessing}
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg transition-all duration-200 flex items-center gap-2"
                    >
                      {txState.isProcessing ? (
                        <>
                          <CircleNotch className="animate-spin" size={20} />
                          Registering Audit...
                        </>
                      ) : (
                        <>
                          <Lock size={20} />
                          Register Audit On-Chain
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Transaction Error Message */}
                {txState.error && (
                  <div className="absolute bottom-4 left-4 right-4 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 rounded-lg">
                    {txState.error}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full bg-gray-900/50 rounded-lg border border-gray-800 flex items-center justify-center text-gray-400">
                Run analysis to see results
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}