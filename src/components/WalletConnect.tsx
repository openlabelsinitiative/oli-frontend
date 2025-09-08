import React, { useState, useRef, useEffect } from 'react';
import { Wallet, LogOut, ChevronDown, Copy, ExternalLink, Zap } from 'lucide-react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

const WalletConnect = () => {
  const { setShowAuthFlow, primaryWallet } = useDynamicContext();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Get wallet info from the primary wallet
  const address = primaryWallet?.address;
  const walletName = primaryWallet?.connector?.name;

  // Check if it's Coinbase Smart Wallet
  const isCoinbaseSmartWallet = walletName?.toLowerCase().includes('coinbase');
  const isOnBase = primaryWallet?.chain === 'EIP155:8453';

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const openInExplorer = () => {
    if (!address) return;
    // Default to Base explorer since we're prioritizing Base network
    const explorerUrl = `https://basescan.org/address/${address}`;
    window.open(explorerUrl, '_blank');
  };

  const handleConnect = () => {
    setShowAuthFlow(true);
  };

  const handleDisconnect = () => {
    if (primaryWallet) {
      primaryWallet.connector.endSession();
    }
    setIsOpen(false);
  };

  // Show connect button if wallet not connected
  if (!primaryWallet || !address) {
    return (
      <button
        onClick={handleConnect}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity duration-200"
      >
        <Wallet className="w-4 h-4" />
        <span className="text-sm font-medium">Connect Wallet</span>
      </button>
    );
  }

  // Connected state - show wallet info and dropdown
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity duration-200"
      >
        <Wallet className="w-4 h-4" />
        <span className="text-sm font-medium">{formatAddress(address)}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            {/* Wallet Type Info */}
            <div className="px-4 py-2 border-b border-gray-100">
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                {isCoinbaseSmartWallet ? 'Smart Wallet' : 'Connected Wallet'}
              </div>
              <div className="text-sm font-medium text-gray-900 mt-1">
                {isCoinbaseSmartWallet ? '🏗️ Coinbase Smart Wallet' : 
                 walletName?.toLowerCase().includes('metamask') ? '🦊 MetaMask' :
                 `🔗 ${walletName || 'Unknown'}`}
              </div>
            </div>

            {/* Dynamic Sponsorship Status */}
            <div className="px-4 py-2 border-b border-gray-100">
              <div className="space-y-1">
                {/* Smart Wallet Status */}
                {isCoinbaseSmartWallet && (
                  <div className="flex items-center text-xs">
                    <span className="text-blue-500 mr-1">🏗️</span>
                    <span className="text-blue-600 font-medium">Dynamic + Smart Wallet Active</span>
                  </div>
                )}
                
                {/* Sponsorship Status */}
                <div className="flex items-center text-xs text-gray-600">
                  {isCoinbaseSmartWallet && isOnBase ? (
                    <>
                      <Zap className="w-3 h-3 mr-1 text-green-500" />
                      <span className="text-green-600">⚡ Gas Sponsorship Available</span>
                    </>
                  ) : isCoinbaseSmartWallet ? (
                    <>
                      <span className="text-amber-600">Switch to Base for gas sponsorship</span>
                    </>
                  ) : (
                    <>
                      <span className="text-gray-500">Use Coinbase Smart Wallet for sponsorship</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Address Actions */}
            <button
              onClick={copyAddress}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Copy className="w-4 h-4 mr-2" />
              {copied ? 'Copied!' : 'Copy Address'}
            </button>

            <button
              onClick={openInExplorer}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Explorer
            </button>

            {/* Disconnect */}
            <div className="border-t border-gray-100">
              <button
                onClick={handleDisconnect}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;