'use client';

import '@/app/globals.css'
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { connectWallet, switchNetwork, CHAIN_CONFIG, ChainKey } from '@/utils/web3';
import { SignOut, List, X, CaretDown, CaretUp } from 'phosphor-react';
import Logo from '/public/logo.svg';

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [currentChain, setCurrentChain] = useState<ChainKey>('lineaSepolia');
  const [isChainMenuOpen, setIsChainMenuOpen] = useState(false);
  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false);
  
  // Check current network on mount and listen for account changes
  useEffect(() => {
    const checkNetwork = async () => {
      if (window.ethereum) {
        try {
          const chainId = await window.ethereum.request({ 
            method: 'eth_chainId' 
          }) as string;
          
          const network = Object.entries(CHAIN_CONFIG).find(
            ([, config]) => config.chainId.toLowerCase() === chainId.toLowerCase()
          );
          
          if (network) {
            setCurrentChain(network[0] as ChainKey);
          }
          
          // Check if already connected
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' 
          }) as string[];
          
          if (accounts && accounts[0]) {
            setAddress(accounts[0]);
          }
        } catch (error) {
          console.error('Error checking network:', error);
        }
      }
    };
    
    checkNetwork();

    // Listen for account changes
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setAddress(null);
        } else {
          setAddress(accounts[0]);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  // Listen for network changes
  useEffect(() => {
    if (window.ethereum) {
      const handleChainChanged = (chainId: string) => {
        const network = Object.entries(CHAIN_CONFIG).find(
          ([, config]) => config.chainId.toLowerCase() === chainId.toLowerCase()
        );
        if (network) {
          setCurrentChain(network[0] as ChainKey);
        }
        setIsNetworkSwitching(false);
      };

      window.ethereum.on('chainChanged', handleChainChanged);
      return () => {
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#chain-switcher')) {
        setIsChainMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConnect = async () => {
    try {
      const { address: walletAddress } = await connectWallet();
      setAddress(walletAddress);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnect = () => {
    setAddress(null);
  };

  const handleChainSwitch = async (chainKey: ChainKey) => {
    if (isNetworkSwitching) return;
    try {
      setIsNetworkSwitching(true);
      await switchNetwork(chainKey);
      setCurrentChain(chainKey);
      setIsChainMenuOpen(false);
    } catch (error) {
      console.error('Failed to switch chain:', error);
    } finally {
      setIsNetworkSwitching(false);
    }
  };

  const formatAddress = (addr: string) => 
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <html lang="en">
      <body className="bg-[#0A0B0D] text-white min-h-screen">
        <nav className="fixed w-full z-50 border-b border-gray-800 bg-[#0A0B0D]/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2 group">
                <Image 
                  src={Logo}
                  alt="AuditFi Logo"
                  width={32}
                  height={32}
                  className="group-hover:opacity-80 transition-opacity duration-200"
                />
                <span className="text-xl font-mono font-bold text-white">
                  AuditFi
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-4">
                {/* Nav Links */}
                <Link 
                  href="/contract-builder" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 py-2"
                >
                  Contract-builder
                </Link>
                <Link 
                  href="/testcase-generator" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 px-3 py-2"
                >
                  Test
                </Link>
                <Link 
                  href="/audit" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 px-3 py-2"
                >
                  Audit
                </Link>
                <Link 
                  href="/reports" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 px-3 py-2"
                >
                  Reports
                </Link>
                <Link 
                  href="/documentor" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 px-3 py-2"
                >
                  Documentor
                </Link>
                <Link 
                  href="/profile" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 px-3 py-2"
                >
                  Profile
                </Link>

                {/* Chain Switcher */}
                <div className="relative" id="chain-switcher">
                  <button
                    onClick={() => !isNetworkSwitching && setIsChainMenuOpen(!isChainMenuOpen)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                      isNetworkSwitching 
                        ? 'bg-gray-700 cursor-not-allowed' 
                        : 'bg-gray-800/50 hover:bg-gray-800'
                    } transition-all duration-200`}
                    disabled={isNetworkSwitching}
                  >
                    {CHAIN_CONFIG[currentChain] && (
                      <Image 
                        src={CHAIN_CONFIG[currentChain].iconPath}
                        alt={CHAIN_CONFIG[currentChain].chainName}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                    )}
                    <span className="text-sm font-medium">
                      {isNetworkSwitching ? 'Switching...' : CHAIN_CONFIG[currentChain]?.chainName || 'Unknown Chain'}
                    </span>
                    {isChainMenuOpen ? (
                      <CaretUp className="w-4 h-4" />
                    ) : (
                      <CaretDown className="w-4 h-4" />
                    )}
                  </button>

                  {/* Chain Dropdown */}
                  {isChainMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-lg bg-gray-800 border border-gray-700 shadow-lg py-1">
                      {Object.entries(CHAIN_CONFIG).map(([key, chain]) => (
                        <button
                          key={key}
                          onClick={() => handleChainSwitch(key as ChainKey)}
                          className={`flex items-center space-x-2 w-full px-4 py-2 text-sm ${
                            currentChain === key 
                              ? 'bg-gray-700 text-white' 
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          } transition-colors duration-200`}
                          disabled={isNetworkSwitching}
                        >
                          <Image 
                            src={chain.iconPath}
                            alt={chain.chainName}
                            width={20}
                            height={20}
                            className="rounded-full"
                          />
                          <span>{chain.chainName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Wallet Connection */}
                {address ? (
                  <button
                    onClick={handleDisconnect}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-white rounded-lg transition-all duration-200"
                  >
                    <span className="text-sm font-medium">{formatAddress(address)}</span>
                    <SignOut className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleConnect}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg transition-all duration-200"
                  >
                    Connect Wallet
                  </button>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button 
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-800/50 transition-colors duration-200"
              >
                {isOpen ? (
                  <X weight="bold" className="w-6 h-6" />
                ) : (
                  <List weight="bold" className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden bg-gray-900/95 backdrop-blur-xl border-b border-gray-800"
            >
              <div className="px-4 pt-2 pb-3 space-y-2">
                <Link 
                  href="/audit" 
                  className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors duration-200"
                >
                  Audit
                </Link>
                <Link 
                  href="/search"
                  className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors duration-200"
                >
                  Search
                </Link>
                <Link 
                  href="/reports"
                  className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors duration-200"
                >
                  Reports
                </Link>
                
                {/* Mobile Chain Switcher */}
                <div className="pt-2 pb-1">
                  <div className="space-y-1">
                    {Object.entries(CHAIN_CONFIG).map(([key, chain]) => (
                      <button
                        key={key}
                        onClick={() => handleChainSwitch(key as ChainKey)}
                        className={`flex items-center space-x-2 w-full px-3 py-2 rounded-lg ${
                          currentChain === key 
                            ? 'bg-gray-800 text-white' 
                            : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                        } transition-colors duration-200`}
                        disabled={isNetworkSwitching}
                      >
                        {chain && (
                          <Image 
                            src={chain.iconPath}
                            alt={chain.chainName}
                            width={20}
                            height={20}
                            className="rounded-full"
                          />
                        )}
                        <span>
                          {isNetworkSwitching && currentChain === key ? 'Switching...' : chain?.chainName || 'Unknown Chain'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Wallet Connection */}
                {address ? (
                  <button
                    onClick={handleDisconnect}
                    className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all duration-200"
                  >
                    {formatAddress(address)}
                    <SignOut className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleConnect}
                    className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg transition-all duration-200"
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </nav>

        <main className="pt-16">
          {children}
        </main>
      </body>
    </html>
  );
}