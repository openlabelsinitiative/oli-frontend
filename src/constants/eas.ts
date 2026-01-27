// src/constants/eas.ts

// Network-specific EAS configuration
export const NETWORK_CONFIG = {
  // Base Mainnet
  8453: {
    name: 'Base',
    easContractAddress: '0x4200000000000000000000000000000000000021',
    schemaUID: '0xcff83309b59685fdae9dad7c63d969150676d51d8eeda66799d1c4898b84556a',
    schemaDefinition: 'string caip10,string tags_json',
    explorerUrl: 'https://base.easscan.org'
  },
  // Arbitrum One
  42161: {
    name: 'Arbitrum One',
    easContractAddress: '0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458',
    schemaUID: '0xcff83309b59685fdae9dad7c63d969150676d51d8eeda66799d1c4898b84556a',
    schemaDefinition: 'string caip10,string tags_json',
    explorerUrl: 'https://arbitrum.easscan.org'
  }
} as const;

export type SupportedChainId = keyof typeof NETWORK_CONFIG;

// Default to Base Mainnet for backward compatibility
export const DEFAULT_ATTESTATION_NETWORK: SupportedChainId = 8453;

// Legacy exports for backward compatibility
export const EAS_CONTRACT_ADDRESS = NETWORK_CONFIG[DEFAULT_ATTESTATION_NETWORK].easContractAddress;
export const SCHEMA_UID = NETWORK_CONFIG[DEFAULT_ATTESTATION_NETWORK].schemaUID;
export const SCHEMA_DEFINITION = NETWORK_CONFIG[DEFAULT_ATTESTATION_NETWORK].schemaDefinition;

// Helper function to get network config
export function getNetworkConfig(chainId: number) {
  const config = NETWORK_CONFIG[chainId as SupportedChainId];
  if (!config) {
    throw new Error(`Unsupported chain ID for attestations: ${chainId}. Supported chains: ${Object.keys(NETWORK_CONFIG).join(', ')}`);
  }
  return config;
}

// Helper to check if a chain ID is supported for attestations
export function isSupportedAttestationChain(chainId: number): chainId is SupportedChainId {
  return chainId in NETWORK_CONFIG;
}
