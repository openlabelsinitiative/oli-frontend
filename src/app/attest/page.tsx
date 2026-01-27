// Attestation Page with URL Parameter Support
// 
// This page supports parametrized URLs for prefilling the attestation form:
//
// URL Parameters:
// - address or contract: The blockchain address/contract to attest (e.g., 0x1234...)
// - chain or chainId: The blockchain network (supports multiple formats):
//   
// Supported Chain Formats:
// 1. Chain ID numbers: 1, 8453, 42161, 10, etc.
// 2. CAIP-2 format: eip155:1, eip155:8453, etc.
// 3. Chain names: ethereum, base, arbitrum, optimism, etc.
// 4. Short names: eth, mainnet, etc.
//
// Example URLs:
// https://openlabelsinitiative.org/attest?address=0x1234567890123456789012345678901234567890&chain=ethereum
// https://openlabelsinitiative.org/attest?contract=0xA0b86a33E6441d1C9FC61e93eAef24fE7b88B24e&chainId=8453
// https://openlabelsinitiative.org/attest?address=0x1234567890123456789012345678901234567890&chain=1
// https://openlabelsinitiative.org/attest?address=0x1234567890123456789012345678901234567890&chain=base
//
// The form will automatically scroll to the single attestation section when parameters are provided.

'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AttestationForm from '@/components/attestation/AttestationForm';
import BulkAttestationForm from '@/components/attestation/BulkAttestationForm';
import BulkAttestationScripts from '@/components/attestation/BulkAttestationScripts';
import UnlabeledContractsList from '@/components/vibe-attest/UnlabeledContractsList';
import VibeAttestSidebar from '@/components/vibe-attest/VibeAttestSidebar';
import { UnlabeledContract } from '@/types/unlabeledContracts';
import { CHAINS } from '@/constants/chains';
import { NETWORK_CONFIG, getNetworkConfig, type SupportedChainId } from '@/constants/eas';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { isEthereumWallet } from '@dynamic-labs/ethereum';
import { switchToAttestationNetwork } from '@/utils/attestationUtils';
import { parseCaip10 } from '@/utils/caipUtils';

// Chain mapping function to convert various formats to CAIP-2
const mapChainToCAIP2 = (chainInput: string): string | undefined => {
  if (!chainInput) return undefined;
  
  const input = chainInput.toLowerCase().trim();
  
  // Check if it's already in CAIP-2 format (eip155:chainId)
  if (input.startsWith('eip155:')) {
    // Verify it matches a known chain
    const matchingChain = CHAINS.find(chain => chain.caip2.toLowerCase() === input);
    return matchingChain?.caip2;
  }
  
  // Check if it's a numeric chain ID
  const numericChainId = parseInt(input);
  if (!isNaN(numericChainId)) {
    const matchingChain = CHAINS.find(chain => chain.caip2.toLowerCase() === `eip155:${numericChainId}`);
    return matchingChain?.caip2;
  }
  
  // Search through all chain properties
  const matchingChain = CHAINS.find(chain => 
    chain.id.toLowerCase() === input ||
    chain.name.toLowerCase() === input ||
    chain.shortName.toLowerCase() === input
  );
  
  return matchingChain?.caip2;
};

// Component that uses useSearchParams
function AttestPageContent() {
  const searchParams = useSearchParams();
  const { primaryWallet } = useDynamicContext();
  const [selectedContract, setSelectedContract] = useState<UnlabeledContract | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(false);
  const [vibeAttestVisible, setVibeAttestVisible] = useState<boolean>(false);
  
  // Advanced Network Mode - disabled by default to keep simple Base workflow
  const [advancedNetworkMode, setAdvancedNetworkMode] = useState<boolean>(false);
  // Selected attestation network for advanced mode (default to Base)
  const [selectedNetwork, setSelectedNetwork] = useState<number>(8453);
  
  // Extract URL parameters for prefilling the form
  const [prefilledAddress, setPrefilledAddress] = useState<string | undefined>(undefined);
  const [prefilledChainId, setPrefilledChainId] = useState<string | undefined>(undefined);
  
  // Create refs for each section
  const singleAttestationRef = useRef<HTMLDivElement>(null);
  const bulkAttestationRef = useRef<HTMLDivElement>(null);
  const bulkScriptsRef = useRef<HTMLDivElement>(null);
  const vibeAttestRef = useRef<HTMLDivElement>(null);

  // Extract URL parameters on component mount
  useEffect(() => {
    if (!searchParams) return;

    // Get address parameter (can be 'address' or 'contract')
    const addressParam = searchParams.get('address') || searchParams.get('contract');
    // Get chain parameter (can be 'chain' or 'chainId')
    const chainParam = searchParams.get('chain') || searchParams.get('chainId');
    
    const parsedCaip10 = addressParam ? parseCaip10(addressParam) : null;

    if (addressParam) {
      setPrefilledAddress(parsedCaip10 ? parsedCaip10.address : addressParam);
    }
    
    if (chainParam) {
      const mappedChain = mapChainToCAIP2(chainParam);
      if (mappedChain) {
        setPrefilledChainId(mappedChain);
      } else {
        console.warn(`Unable to map chain parameter "${chainParam}" to a supported chain`);
      }
    } else if (parsedCaip10?.isKnownChain) {
      setPrefilledChainId(parsedCaip10.chainId);
    }
    
    // Handle hash-based routing and auto-scroll
    const handleHashAndParams = () => {
      const hash = window.location.hash.replace('#', '');
      
      // If parameters are provided or hash is single-attestation, scroll to single attestation
      if (addressParam || chainParam || hash === 'single-attestation') {
        setTimeout(() => {
          scrollToElement(singleAttestationRef, 'single-attestation');
        }, 100);
      }
      // Handle other hash sections
      else if (hash === 'bulk-attestation') {
        setTimeout(() => {
          scrollToElement(bulkAttestationRef, 'bulk-attestation');
        }, 100);
      }
      else if (hash === 'bulk-scripts') {
        setTimeout(() => {
          scrollToElement(bulkScriptsRef, 'bulk-scripts');
        }, 100);
      }
      else if (hash === 'vibe-attest') {
        setVibeAttestVisible(true);
        setTimeout(() => {
          scrollToElement(vibeAttestRef, 'vibe-attest');
        }, 100);
      }
    };
    
    handleHashAndParams();
    
    // Listen for hash changes
    const handleHashChange = () => handleHashAndParams();
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [searchParams]);

  const handleSelectContract = (contract: UnlabeledContract) => {
    setSelectedContract(contract);
    setSidebarVisible(true);
  };

  const clearSelectedContract = () => {
    setSidebarVisible(false);
    
    // Delay clearing the contract data until after the transition
    setTimeout(() => {
      setSelectedContract(null);
    }, 300);
  };

  // Function to scroll to an element and center it
  const scrollToElement = (elementRef: React.RefObject<any>, hash: string, block: ScrollLogicalPosition = 'center') => {
    // Update URL with hash
    window.history.pushState(null, '', `#${hash}`);
    
    // Scroll the element into view
    if (elementRef.current) {
      setTimeout(() => {
        elementRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: block
        });
      }, 100);
    }
  };

  // Handle window resize for mobile view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && sidebarVisible) {
        // On mobile, scroll to the top when sidebar opens
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarVisible]);

  // Check URL hash on load to scroll to right section
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          // If it's the vibe-attest section, open dropdown first
          if (hash === 'vibe-attest') {
            setVibeAttestVisible(true);
            
            // Allow time for the dropdown to fully open
            setTimeout(() => {
              // Scroll to position the first contract near the top
              const contractsList = document.querySelector('.unlabeled-contracts-list');
              if (contractsList) {
                contractsList.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start'
                });
              } else {
                // Fallback to the section header
                element.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start'
                });
              }
            }, 300);
          } else {
            // For other sections, center them
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }
      }, 500);
    }
  }, []);

  // Switch wallet chain when network is selected in advanced mode
  useEffect(() => {
    const switchWalletChain = async () => {
      // Only switch if advanced mode is enabled and wallet is connected
      if (!advancedNetworkMode || !primaryWallet) {
        return;
      }

      // Verify it's an Ethereum wallet
      if (!isEthereumWallet(primaryWallet)) {
        return;
      }

      // Check if wallet is already on the selected network
      try {
        const walletClient = await primaryWallet.getWalletClient();
        const currentChainId = await walletClient.getChainId();
        
        // Only switch if we're not already on the selected network
        if (currentChainId === selectedNetwork) {
          return;
        }

        // Switch to the selected network
        await switchToAttestationNetwork(primaryWallet, selectedNetwork as SupportedChainId);
      } catch (error) {
        // Log error but don't show notification to avoid interrupting user flow
        console.error('Failed to switch wallet network:', error);
      }
    };

    switchWalletChain();
  }, [advancedNetworkMode, selectedNetwork, primaryWallet]);

  return (
    <main className="max-w-7xl mx-auto p-8 space-y-16">
      {/* Introduction Section */}
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">Attestation Hub</h1>
        <p className="text-gray-700 mb-4">
          Welcome to the OLI Attestation Hub, where you can assign tags to blockchain addresses and smart contracts to improve transparency and discoverability.
        </p>
        
        {/* Sponsored Fees Notice & Advanced Network Mode Toggle */}
        <div className="space-y-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-green-800 mb-1">💡 Pro Tip: Gas-Free Attestations</h3>
                <p className="text-sm text-green-700">
                  <strong>Connect with Coinbase Smart Wallet on Base network</strong> to enjoy sponsored gas fees for your attestations. 
                  No need to worry about transaction costs - we&apos;ve got you covered!
                </p>
              </div>
            </div>
          </div>

          {/* Advanced Network Mode Toggle */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900 mb-1.5">Advanced Attestation Network Selection</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Enable this option to submit attestations to networks beyond Base (e.g., Arbitrum). 
                    <span className="font-semibold text-blue-700"> Note: Gas fees may apply on other networks.</span>
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 ml-6">
                <button
                  onClick={() => setAdvancedNetworkMode(!advancedNetworkMode)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    advancedNetworkMode ? 'bg-blue-600 shadow-md' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={advancedNetworkMode}
                  aria-label="Toggle advanced network selection"
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                      advancedNetworkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            
            {advancedNetworkMode && (
              <div className="mt-6 pt-6 border-t border-blue-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Choose Attestation Network</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(NETWORK_CONFIG).map(([chainId, config]) => {
                    const isSelected = selectedNetwork === parseInt(chainId);
                    const isBaseNetwork = parseInt(chainId) === 8453 || parseInt(chainId) === 84532;
                    
                    return (
                      <button
                        key={chainId}
                        onClick={() => setSelectedNetwork(parseInt(chainId))}
                        className={`relative p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                          isSelected
                            ? 'border-blue-500 bg-white shadow-md ring-2 ring-blue-200'
                            : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className={`font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                                {config.name}
                              </h5>
                              {isSelected && (
                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {isBaseNetwork ? (
                                <>
                                  <span className="inline-flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-medium text-green-700">Gas-free</span>
                                  </span>
                                  {' '}with Coinbase Smart Wallet
                                </>
                              ) : (
                                <>
                                  <span className="inline-flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-medium text-amber-700">Gas fees apply</span>
                                  </span>
                                  {' '}on this network
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                <div className="mt-4 bg-blue-100 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      All attestations (single and bulk) will be recorded on <span className="font-bold">{getNetworkConfig(selectedNetwork).name}</span>.
                      {selectedNetwork === 8453 || selectedNetwork === 84532 ? 
                        ' Coinbase Smart Wallet users enjoy sponsored transactions with no gas fees.' : 
                        ' Please ensure you have sufficient funds for gas fees on this network.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Single Address Attestation */}
          <div 
            className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] p-6 border-l-4 border-blue-500 cursor-pointer hover:shadow-lg transition-all duration-200 flex flex-col h-full"
            onClick={() => {
              scrollToElement(singleAttestationRef, 'single-attestation');
            }}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Single Address Attestation</h3>
            <p className="text-gray-600 mb-2">
              Assign tags to an individual blockchain address or smart contract.
            </p>
            <ul className="mb-4 space-y-1 text-sm text-gray-600 flex-grow">
              <li className="flex items-start">
                <svg className="w-4 h-4 mt-0.5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                One address at a time
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 mt-0.5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Multiple tags per address
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 mt-0.5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Quick and simple interface
              </li>
            </ul>
            <span className="text-blue-600 font-medium inline-flex items-center mt-auto">
              Go to single attestation
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </span>
          </div>
          
          {/* Card 2: CSV Upload */}
          <div 
            className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] p-6 border-l-4 border-green-500 cursor-pointer hover:shadow-lg transition-all duration-200 flex flex-col h-full"
            onClick={() => {
              scrollToElement(bulkAttestationRef, 'bulk-attestation');
            }}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">CSV Upload</h3>
            <p className="text-gray-600 mb-2">
              Upload a CSV file with multiple addresses to attest at once.
            </p>
            <ul className="mb-4 space-y-1 text-sm text-gray-600 flex-grow">
              <li className="flex items-start">
                <svg className="w-4 h-4 mt-0.5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Up to 50 attestations at once
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 mt-0.5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Easy upload through UI
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 mt-0.5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Perfect for analysts and projects
              </li>
            </ul>
            <span className="text-green-600 font-medium inline-flex items-center mt-auto">
              Go to CSV upload
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </span>
          </div>
          
          {/* Card 3: Bulk Attestation Scripts */}
          <div 
            className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] p-6 border-l-4 border-purple-500 cursor-pointer hover:shadow-lg transition-all duration-200 flex flex-col h-full"
            onClick={() => {
              scrollToElement(bulkScriptsRef, 'bulk-scripts');
            }}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Developer Tools & SDKs</h3>
            <p className="text-gray-600 mb-2">
              Use our Python package and TypeScript script for large-scale attestation needs.
            </p>
            <ul className="mb-4 space-y-1 text-sm text-gray-600 flex-grow">
              <li className="flex items-start">
                <svg className="w-4 h-4 mt-0.5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Python pip package (oli-python)
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 mt-0.5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                TypeScript CSV bulk uploader
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 mt-0.5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Easy pipeline integration
              </li>
            </ul>
            <span className="text-purple-600 font-medium inline-flex items-center mt-auto">
              Explore scripts
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </span>
          </div>
          
          {/* Card 4: Vibe Attest */}
          <div 
            className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] p-6 border-l-4 border-pink-500 cursor-pointer hover:shadow-lg transition-all duration-200 flex flex-col h-full"
            onClick={() => {
              // First make sure dropdown is open, then scroll to it
              const wasAlreadyOpen = vibeAttestVisible;
              setVibeAttestVisible(true);
              
              // Update URL with hash
              window.history.pushState(null, '', '#vibe-attest');
              
              // Allow time for the dropdown to open before scrolling
              setTimeout(() => {
                if (wasAlreadyOpen) {
                  // If already open, just scroll to position the contracts list at the top
                  const contractsList = document.querySelector('.unlabeled-contracts-list');
                  if (contractsList) {
                    contractsList.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start'
                    });
                  } else {
                    // Fallback to section if list can't be found
                    vibeAttestRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start'
                    });
                  }
                } else {
                  // If it wasn't open, first ensure the section is visible
                  vibeAttestRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                  });
                  
                  // Then after animation completes, scroll to the contracts list
                  setTimeout(() => {
                    const contractsList = document.querySelector('.unlabeled-contracts-list');
                    if (contractsList) {
                      contractsList.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                      });
                    }
                  }, 400);
                }
              }, wasAlreadyOpen ? 100 : 300);
            }}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Discover & Attest</h3>
            <p className="text-gray-600 mb-2">
              Browse high-value unlabeled contracts to attest.
            </p>
            <ul className="mb-4 space-y-1 text-sm text-gray-600 flex-grow">
              <li className="flex items-start">
                <svg className="w-4 h-4 mt-0.5 mr-2 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Curated high-impact contracts
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 mt-0.5 mr-2 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Prioritized by transaction volume
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 mt-0.5 mr-2 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Ideal for community contributors
              </li>
            </ul>
            <span className="text-pink-600 font-medium inline-flex items-center mt-auto">
              Explore contracts
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </span>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold mb-2 flex items-center text-gray-900">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            What is an attestation?
          </h3>
          <p className="text-gray-700">
            Attestations are onchain verifiable statements that assign specific tags or properties to blockchain addresses. 
            By providing attestations, you help create a more transparent blockchain ecosystem where addresses can be 
            identified by their purpose, ownership, or other relevant properties.
          </p>
        </div>
      </div>

      {/* Single Address Attestation Section */}
      <div id="single-attestation" ref={singleAttestationRef} className="max-w-7xl mx-auto bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] overflow-hidden border-t-4 border-blue-500 mt-16">
        <div className="p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Single Address Attestation</h2>
          <p className="text-gray-600 mt-2">
            Use this form to attest a single blockchain address. You can add multiple tags to the same address.
          </p>
        </div>
        <div className="pb-1">
        <AttestationForm 
          prefilledAddress={prefilledAddress}
          prefilledChainId={prefilledChainId}
          enableNetworkSelection={advancedNetworkMode}
          selectedAttestationNetwork={selectedNetwork}
        />
        </div>
      </div>
      
      {/* Bulk Address Attestation via CSV Section */}
      <div id="bulk-attestation" ref={bulkAttestationRef} className="max-w-7xl mx-auto bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] overflow-hidden border-t-4 border-green-500 mt-16">
        <div className="p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Bulk Address Attestation via CSV</h2>
          <p className="text-gray-600 mt-2">
            Upload a CSV file with multiple addresses to create attestations in bulk. Limited to 50 addresses per upload.
          </p>
        </div>
        <BulkAttestationForm 
          enableNetworkSelection={advancedNetworkMode}
          selectedAttestationNetwork={selectedNetwork}
        />
      </div>

      {/* Bulk Scripts Section */}
      <div id="bulk-scripts" ref={bulkScriptsRef} className="max-w-7xl mx-auto bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] overflow-hidden border-t-4 border-purple-500 mt-16">
        <div className="p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Developer Tools & SDKs</h2>
          <p className="text-gray-600 mt-2">
            For handling larger datasets or integrating with your data pipeline, we provide several script options.
            Choose the one that best fits your use case and technical requirements.
          </p>
        </div>
        <BulkAttestationScripts />
      </div>

      {/* Vibe Attest Section */}
      <div id="vibe-attest" ref={vibeAttestRef} className="max-w-7xl mx-auto bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] overflow-hidden border-t-4 border-pink-500 mt-16">
        <div className="p-6">
          <button
            onClick={() => setVibeAttestVisible(!vibeAttestVisible)}
            className="w-full flex justify-between items-center text-left py-4 px-4 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
          >
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900">Discover & Attest</h2>
                <span className="text-sm px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-medium">Click to expand</span>
              </div>
              <p className="text-gray-700 mt-2">
                Explore unlabeled smart contracts with high transaction volume and gas spent and help the community by providing attestations.
              </p>
            </div>
            <div className={`transform transition-transform duration-200 ${vibeAttestVisible ? 'rotate-180' : ''} bg-gray-50 p-2 rounded-full group-hover:bg-gray-100`}>
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {vibeAttestVisible && (
            <div className="mt-6 border-t pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 transition-all duration-300">
                <div className={`transition-all duration-300 ease-in-out ${sidebarVisible ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
                  <div className="unlabeled-contracts-list">
                    <UnlabeledContractsList 
                      onSelectContract={handleSelectContract}
                      sidebarVisible={sidebarVisible} 
                    />
                  </div>
                </div>
                
                <div className={`transition-all duration-300 ease-in-out ${sidebarVisible ? 'lg:col-span-4 block' : 'lg:col-span-0 hidden'} relative`}>
                  <div className="sticky top-8">
                    <VibeAttestSidebar 
                      contract={selectedContract}
                      visible={sidebarVisible}
                      onClose={clearSelectedContract}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// Main export with Suspense wrapper
export default function AttestPage() {
  return (
    <Suspense fallback={
      <main className="max-w-7xl mx-auto p-8 space-y-16">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-64 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </main>
    }>
      <AttestPageContent />
    </Suspense>
  );
}
