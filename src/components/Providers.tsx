'use client';

import { ApolloProvider } from '@apollo/client';
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { DynamicWagmiConnector } from '@dynamic-labs/wagmi-connector';
import { createConfig, WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import { mainnet, base, linea, arbitrum, optimism } from 'viem/chains';
import client from '@/lib/apollo-client';

// Create Wagmi config
const config = createConfig({
  chains: [mainnet, base, linea, arbitrum, optimism],
  multiInjectedProviderDiscovery: false,
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [linea.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
  },
});

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DynamicContextProvider
      settings={{
        // Your Dynamic Environment ID
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID || 'your-dynamic-environment-id',
        
        // Wallet connectors - includes Coinbase Smart Wallet
        walletConnectors: [EthereumWalletConnectors],
        
        // Recommend Coinbase Smart Wallet (prioritizes it in the list)
        recommendedWallets: [
          { walletKey: 'coinbase' },
        ],
        
        // New to Web3 section - recommends Coinbase for new users
        newToWeb3WalletChainMap: {
          primary_chain: 'evm',
          wallets: {
            evm: 'coinbase'
          },
        },
        
        // Configure supported networks including Base
        overrides: {
          evmNetworks: [
            {
              blockExplorerUrls: ['https://etherscan.io/'],
              chainId: 1,
              chainName: 'Ethereum Mainnet',
              iconUrls: ['https://app.dynamic.xyz/assets/networks/eth.svg'],
              name: 'Ethereum',
              nativeCurrency: {
                decimals: 18,
                name: 'Ether',
                symbol: 'ETH',
              },
              networkId: 1,
              rpcUrls: ['https://rpc.mevblocker.io/fast'],
              vanityName: 'Ethereum',
            },
            {
              blockExplorerUrls: ['https://basescan.org/'],
              chainId: 8453,
              chainName: 'Base',
              iconUrls: ['https://app.dynamic.xyz/assets/networks/base.svg'],
              name: 'Base',
              nativeCurrency: {
                decimals: 18,
                name: 'Ether',
                symbol: 'ETH',
              },
              networkId: 8453,
              rpcUrls: ['https://api.developer.coinbase.com/rpc/v1/base/hyKHUTPE7kd0VnvFqYsMiAUjvg1wshR3'], // Your paymaster URL
              vanityName: 'Base',
            },
            {
              blockExplorerUrls: ['https://lineascan.build/'],
              chainId: 59144,
              chainName: 'Linea',
              iconUrls: ['https://app.dynamic.xyz/assets/networks/linea.svg'],
              name: 'Linea',
              nativeCurrency: {
                decimals: 18,
                name: 'Ether',
                symbol: 'ETH',
              },
              networkId: 59144,
              rpcUrls: ['https://linea.drpc.org'],
              vanityName: 'Linea',
            },
            {
              blockExplorerUrls: ['https://arbiscan.io/'],
              chainId: 42161,
              chainName: 'Arbitrum One',
              iconUrls: ['https://app.dynamic.xyz/assets/networks/arbitrum.svg'],
              name: 'Arbitrum',
              nativeCurrency: {
                decimals: 18,
                name: 'Ether',
                symbol: 'ETH',
              },
              networkId: 42161,
              rpcUrls: ['https://arb1.arbitrum.io/rpc'],
              vanityName: 'Arbitrum',
            },
            {
              blockExplorerUrls: ['https://optimistic.etherscan.io/'],
              chainId: 10,
              chainName: 'Optimism',
              iconUrls: ['https://app.dynamic.xyz/assets/networks/optimism.svg'],
              name: 'Optimism',
              nativeCurrency: {
                decimals: 18,
                name: 'Ether',
                symbol: 'ETH',
              },
              networkId: 10,
              rpcUrls: ['https://mainnet.optimism.io'],
              vanityName: 'Optimism',
            },
          ],
        },
        
        // App info
        appName: 'Open Labels Initiative',
        appLogoUrl: 'https://openlabelsinitiative.org/oli-logo.png',
        
        // Default to Base network for Smart Wallet compatibility
        initialAuthenticationMode: 'connect-only',
        
        // Privacy settings - minimal data collection
        enableVisitTrackingOnConnectOnly: false,
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>
            <ApolloProvider client={client}>
              {children}
            </ApolloProvider>
          </DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}