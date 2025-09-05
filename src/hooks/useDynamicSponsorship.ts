// Dynamic SDK hook for sponsored transactions with Coinbase Smart Wallet
import { useState, useEffect } from 'react';
import { useDynamicContext, useUserWallets } from '@dynamic-labs/sdk-react-core';
import { isEthereumWallet } from '@dynamic-labs/ethereum';

export interface DynamicSponsorshipCapabilities {
  isSupported: boolean;
  isCoinbaseSmartWallet: boolean;
  canSponsorTransactions: boolean;
  isOnBase: boolean;
}

export const useDynamicSponsorship = () => {
  const { user } = useDynamicContext();
  const userWallets = useUserWallets();
  const [capabilities, setCapabilities] = useState<DynamicSponsorshipCapabilities>({
    isSupported: false,
    isCoinbaseSmartWallet: false,
    canSponsorTransactions: false,
    isOnBase: false
  });

  const primaryWallet = userWallets[0];
  const walletName = primaryWallet?.connector?.name;
  const isCoinbaseSmartWallet = walletName?.toLowerCase().includes('coinbase') || false;
  const isOnBase = primaryWallet?.chain === 'EIP155:8453';

  useEffect(() => {
    const checkCapabilities = () => {
      if (!user || !primaryWallet) {
        setCapabilities({
          isSupported: false,
          isCoinbaseSmartWallet: false,
          canSponsorTransactions: false,
          isOnBase: false
        });
        return;
      }

      setCapabilities({
        isSupported: true,
        isCoinbaseSmartWallet,
        canSponsorTransactions: isCoinbaseSmartWallet && isOnBase,
        isOnBase
      });
    };

    checkCapabilities();
  }, [user, primaryWallet, isCoinbaseSmartWallet, isOnBase]);

  // Send sponsored transaction using Dynamic's Viem-based approach
  const sendSponsoredTransaction = async (to: string, value: string = '0x0', data: string = '0x') => {
    if (!primaryWallet || !capabilities.canSponsorTransactions) {
      throw new Error('Sponsored transactions not available');
    }

    if (!isEthereumWallet(primaryWallet)) {
      throw new Error('Wallet is not an Ethereum wallet');
    }

    try {
      // Get wallet client using Dynamic's Viem integration
      const walletClient = await primaryWallet.getWalletClient();

      // For Coinbase Smart Wallet on Base, Dynamic handles paymaster integration automatically
      const result = await walletClient.sendTransaction({
        to: to as `0x${string}`,
        value: BigInt(value),
        data: data as `0x${string}`,
      });

      console.log('Sponsored transaction sent:', result);
      return result;
    } catch (error) {
      console.error('Sponsored transaction failed:', error);
      throw error;
    }
  };

  // Get sponsorship status message
  const getSponsorshipMessage = (): string => {
    if (!user) {
      return 'Connect wallet to check sponsorship';
    }
    
    if (!isCoinbaseSmartWallet) {
      return 'Use Coinbase Smart Wallet for gas sponsorship';
    }
    
    if (!isOnBase) {
      return 'Switch to Base network for gas sponsorship';
    }
    
    return '⚡ Gas fees sponsored by Dynamic + Coinbase';
  };

  return {
    capabilities,
    sendSponsoredTransaction,
    getSponsorshipMessage,
    primaryWallet
  };
};
