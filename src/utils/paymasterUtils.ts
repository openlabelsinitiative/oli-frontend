// Paymaster utilities for sponsored transactions on Base
import { useUserWallets } from '@dynamic-labs/sdk-react-core';

export interface PaymasterConfig {
  rpcUrl: string;
  chainId: number;
  enabled: boolean;
}

// Coinbase paymaster configuration for Base network
export const COINBASE_PAYMASTER_CONFIG: PaymasterConfig = {
  rpcUrl: 'https://api.developer.coinbase.com/rpc/v1/base/hyKHUTPE7kd0VnvFqYsMiAUjvg1wshR3',
  chainId: 8453, // Base
  enabled: true
};

// Network configurations with paymaster support
export const NETWORK_PAYMASTER_CONFIG: Record<number, PaymasterConfig | null> = {
  1: null, // Ethereum - no paymaster
  8453: COINBASE_PAYMASTER_CONFIG, // Base - Coinbase paymaster
  59144: null, // Linea - no paymaster
};

/**
 * Check if paymaster is available for the current network
 */
export const isPaymasterAvailable = (chainId: number): boolean => {
  const config = NETWORK_PAYMASTER_CONFIG[chainId];
  return config?.enabled ?? false;
};

/**
 * Get paymaster configuration for a specific chain
 */
export const getPaymasterConfig = (chainId: number): PaymasterConfig | null => {
  return NETWORK_PAYMASTER_CONFIG[chainId] || null;
};

/**
 * Check if the current wallet supports sponsored transactions
 */
export const usePaymasterSupport = () => {
  const userWallets = useUserWallets();
  const wallet = userWallets[0];
  
  const isSmartWallet = wallet?.connector?.name?.toLowerCase().includes('coinbase') || false;
  const isOnBase = wallet?.chain === 'EIP155:8453'; // Base chain ID for Dynamic
  const paymasterConfig = getPaymasterConfig(8453); // Base
  
  return {
    isSupported: isSmartWallet && isOnBase && paymasterConfig?.enabled,
    walletType: wallet?.connector?.name,
    chainId: wallet?.chain,
    paymasterAvailable: paymasterConfig?.enabled ?? false
  };
};

/**
 * Helper to format transaction for paymaster (if needed)
 */
export const preparePaymasterTransaction = (
  transaction: any,
  chainId: number
): any => {
  const paymasterConfig = getPaymasterConfig(chainId);
  
  if (!paymasterConfig?.enabled) {
    return transaction; // Return as-is if no paymaster
  }
  
  // For Coinbase Smart Wallet, the paymaster is handled automatically
  // when using the paymaster RPC URL
  return {
    ...transaction,
    // The paymaster sponsorship is handled by the RPC endpoint
    // No additional fields needed for Coinbase paymaster
  };
};

/**
 * Get user-friendly paymaster status message
 */
export const getPaymasterStatusMessage = (chainId: number, walletType?: string): string => {
  const paymasterConfig = getPaymasterConfig(chainId);
  
  if (!paymasterConfig?.enabled) {
    return 'Gas fees will be paid by your wallet';
  }
  
  if (walletType === 'coinbase_smart_wallet') {
    return '⚡ Gas fees sponsored by Base Account Paymaster';
  }
  
  if (walletType === 'coinbase_wallet') {
    return 'Gas fees paid by wallet (upgrade to Base Account for sponsorship)';
  }
  
  return 'Gas fees may be sponsored (Base Account recommended)';
};
