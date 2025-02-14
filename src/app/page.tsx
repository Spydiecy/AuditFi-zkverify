'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';
import {
  Shield,
  ArrowRight,
  Star,
  Code,
  Lightning,
  TwitterLogo,
  GithubLogo,
  DiscordLogo,
  TelegramLogo,
  FileSearch,
  Robot,
  Cube,
  FileText,
  TestTube,
} from 'phosphor-react';
import Image from 'next/image';
import Link from 'next/link';
import { CHAIN_CONFIG } from '@/utils/web3';

interface Audit {
  contractHash: string;
  stars: number;
  summary: string;
  auditor: string;
  timestamp: number;
  chain: string;
}

const features = [
  {
    icon: Shield,
    title: 'AI-Powered Analysis',
    description: 'Advanced smart contract analysis powered by Finetuned AI'
  },
  {
    icon: Lightning,
    title: 'Multi-Chain Support',
    description: 'Audit smart contracts across multiple blockchain networks'
  },
  {
    icon: Code,
    title: 'On-Chain Verification',
    description: 'All audit reports are stored permanently on the blockchain'
  },
    {
    icon: FileText,
    title: 'Documentation Generation',
    description: 'Gemini powered documentation for Solidity contracts'
  },
  {
      icon: TestTube,
      title: 'Test Suite Generation',
      description: 'Multi-framework test case generation'
    },
];

const recentAudits: Audit[] = [
  {
    contractHash: '0x123...abc',
    stars: 5,
    summary: 'No critical vulnerabilities found. Code follows best practices.',
    auditor: '0xABc...123',
    timestamp: 1703116800,
    chain: 'educhainTestnet'
  },
  {
    contractHash: '0x456...def',
    stars: 4,
    summary: 'Minor optimizations suggested. Overall secure implementation.',
    auditor: '0xDEf...456',
    timestamp: 1703030400,
    chain: 'educhainTestnet'
  },
  {
    contractHash: '0x789...ghi',
    stars: 5,
    summary: 'Excellent implementation with robust security measures.',
    auditor: '0xGHi...789',
    timestamp: 1702944000,
    chain: 'educhainTestnet'
  },
  {
    contractHash: '0x101...jkl',
    stars: 5,
    summary: 'Thoroughly audited with no vulnerabilities found.',
    auditor: '0xJKl...101',
    timestamp: 1702857600,
    chain: 'educhainTestnet'
  }
];

const steps = [
  {
    icon: FileSearch,
    title: 'Submit Contract',
    description: 'Paste your Solidity smart contract code into our platform'
  },
  {
    icon: Robot,
    title: 'AI Analysis',
    description: 'Our Fintuned AI analyzes your code for vulnerabilities'
  },
    {
    icon: FileText,
    title: 'Generate Docs',
    description: 'Generate comprehensive contract documentation with a single click'
    },
  {
    icon: TestTube,
    title: 'Test Suite',
    description: 'Generate test suite with best practices for popular frameworks'
  },
  {
    icon: Cube,
    title: 'On-Chain Report',
    description: 'Audit report is permanently stored on the blockchain'
  },
  {
    icon: Shield,
    title: 'Verification',
    description: 'Get your smart contract verified and secure'
  }
];


export default function Home() {
  useEffect(() => {
    // Initialize AOS
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-cubic'
    });

    // Gradient hover effect
    const handleMouseMove = (e: MouseEvent) => {
      const elements = document.getElementsByClassName('hover-gradient-effect');
      Array.from(elements).forEach((element) => {
        const htmlElement = element as HTMLElement;
        const rect = htmlElement.getBoundingClientRect();
        htmlElement.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        htmlElement.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/10 via-[#0A0B0D] to-blue-900/10" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl md:text-7xl font-mono font-bold mb-6">
                NEXT-GEN<br /> SMART CONTRACT<br />
                <span className="text-emerald-400">SECURITY</span>
              </h1>
              <p className="text-gray-400 text-lg mb-8 max-w-xl">
                Secure your smart contracts with AI-powered analysis, documentation, and on-chain verification. Generate test suites and comprehensive documentation effortlessly. Get instant security audits powered by Finetuned AI.
              </p>
              <div className="flex gap-4">
                <Link href="/audit">
                  <button className="hover-gradient-effect px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg transition-all duration-200 flex items-center gap-2">
                    Start Audit <ArrowRight weight="bold" />
                  </button>
                </Link>
                <Link href="/reports">
                  <button className="hover-gradient-effect px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all duration-200">
                    View Reports
                  </button>
                </Link>
              </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="hidden lg:block relative"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-lg" />
                <Image
                    src="/screenshot.png"
                    alt="AuditFi Interface"
                    width={600}
                    height={400}
                    className="rounded-lg shadow-2xl border border-gray-800"
                    priority={true} // Added priority
                    layout="responsive"
                    sizes="(max-width: 768px) 100vw, 600px"
                />
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold font-mono mb-4">
              How It Works
            </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Secure your smart contracts in six simple steps
              </p>
          </motion.div>

          <div className="grid md:grid-cols-6 gap-8">
            {steps.map((step, index) => (
              <div
                key={index}
                data-aos="fade-up"
                data-aos-delay={index * 100}
                className="relative hover-gradient-effect bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50"
              >
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center font-bold text-black">
                  {index + 1}
                </div>
                <step.icon size={32} className="text-emerald-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
                {index < 5 && (
                  <ArrowRight
                    className="absolute -right-4 top-1/2 transform -translate-y-1/2 text-emerald-400"
                    size={24}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold font-mono mb-4">
              Powered by Advanced Technology
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Combining AI analysis, documentation generation, test suite, with blockchain verification for comprehensive smart contract security
            </p>
          </motion.div>

          <div className="grid md:grid-cols-5 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                data-aos="fade-up"
                data-aos-delay={index * 100}
                className="hover-gradient-effect bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50"
              >
                <feature.icon size={32} className="text-emerald-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Networks Section */}
      <section className="py-20 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold font-mono mb-4">Supported Networks</h2>
            <p className="text-gray-400">Currently supporting multiple testnets with mainnet coming soon</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {Object.entries(CHAIN_CONFIG).map(([key, chain], index) => (
              <motion.div
                key={key}
                data-aos="fade-up"
                data-aos-delay={index * 100}
                className="hover-gradient-effect flex items-center space-x-4 bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50"
              >
                <Image
                  src={chain.iconPath}
                  alt={chain.chainName}
                  width={40}
                  height={40}
                  className="rounded-full"
                  layout='fixed'
                />
                <div>
                  <h3 className="font-semibold">{chain.chainName}</h3>
                  <p className="text-gray-400 text-sm">{chain.nativeCurrency.symbol}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Audits */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-mono">Recent Audits</h2>
            <Link href="/reports" className="text-emerald-400 hover:text-emerald-300 transition-colors duration-200 flex items-center gap-2">
              View All <ArrowRight weight="bold" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-sm">
                  <th className="py-4 text-left font-mono font-normal">CONTRACT</th>
                  <th className="py-4 text-left font-mono font-normal">CHAIN</th>
                  <th className="py-4 text-left font-mono font-normal">RATING</th>
                  <th className="py-4 text-left font-mono font-normal">SUMMARY</th>
                  <th className="py-4 text-left font-mono font-normal">AUDITOR</th>
                  <th className="py-4 text-left font-mono font-normal">DATE</th>
                  <th className="py-4 w-4"></th>
                </tr>
              </thead>
              <tbody>
                {recentAudits.map((audit, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors duration-200"
                  >
                    <td className="py-6 font-mono text-white">
                      {audit.contractHash}
                    </td>
                    <td className="py-6">
                      <div className="flex items-center gap-2">
                        <Image
                          src={CHAIN_CONFIG[audit.chain as keyof typeof CHAIN_CONFIG].iconPath}
                          alt={CHAIN_CONFIG[audit.chain as keyof typeof CHAIN_CONFIG].chainName}
                          width={16}
                          height={16}
                          className="rounded-full"
                            layout="fixed"
                        />
                        <span className="text-gray-200">
                          {CHAIN_CONFIG[audit.chain as keyof typeof CHAIN_CONFIG].chainName}
                        </span>
                      </div>
                    </td>
                    <td className="py-6">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            weight={i < audit.stars ? "fill" : "regular"}
                            className={i < audit.stars ? "text-emerald-400" : "text-gray-800"}
                            size={16}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="py-6 text-gray-400 max-w-md">
                      <div className="truncate">
                        {audit.summary}
                      </div>
                    </td>
                    <td className="py-6 font-mono text-gray-200">
                      {audit.auditor}
                    </td>
                    <td className="py-6 text-gray-400">
                      {new Date(audit.timestamp * 1000).toLocaleDateString()}
                    </td>
                    <td className="py-6">
                      <Link href={`/reports/${audit.contractHash}`}>
                        <ArrowRight className="w-4 h-4 text-emerald-400 hover:text-emerald-300 transition-colors duration-200" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900/30">
        <div className="max-w-7=7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl overflow-hidden hover-gradient-effect">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10" />
            <div className="relative p-12 text-center">
              <h2 className="text-4xl font-bold font-mono mb-6">
                Ready to Secure Your Smart Contracts?
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
                Get started with our AI-powered audit platform and ensure your protocol&apos;s security
              </p>
              <Link href="/audit">
                <button className="hover-gradient-effect px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg transition-all duration-200 flex items-center gap-2 mx-auto">
                  Start Free Audit <ArrowRight weight="bold" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900/30 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo & Description */}
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Image
                  src="/logo.svg"
                  alt="AuditFi Logo"
                  width={32}
                  height={32}
                />
                <span className="text-xl font-mono font-bold">
                  AuditFi
                </span>
              </div>
              <p className="text-gray-400 mb-4">
                  Next-generation smart contract security powered by AI.
                  Get instant audits, documentation generation, and test suites for your Web3 projects.
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://twitter.com/auditfi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  <TwitterLogo size={24} />
                </a>
                <a
                  href="https://github.com/auditfi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  <GithubLogo size={24} />
                </a>
                <a
                  href="https://discord.gg/auditfi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  <DiscordLogo size={24} />
                </a>
                <a
                  href="https://t.me/auditfi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  <TelegramLogo size={24} />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/audit" className="text-gray-400 hover:text-emerald-400 transition-colors">
                    Start Audit
                  </Link>
                </li>
                <li>
                  <Link href="/reports" className="text-gray-400 hover:text-emerald-400 transition-colors">
                    Reports
                  </Link>
                </li>
                <li>
                  <Link href="/search" className="text-gray-400 hover:text-emerald-400 transition-colors">
                    Search
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <a href="https://docs.auditfi.com" className="text-gray-400 hover:text-emerald-400 transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="/blog" className="text-gray-400 hover:text-emerald-400 transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="/faq" className="text-gray-400 hover:text-emerald-400 transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} AuditFi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}