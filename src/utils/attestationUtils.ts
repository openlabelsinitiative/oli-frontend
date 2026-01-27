// src/utils/attestationUtils.ts
import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { getNetworkConfig, isSupportedAttestationChain, type SupportedChainId } from '../constants/eas';
import { getWeb3Provider, getSigner } from '@dynamic-labs/ethers-v6';
import { encodeFunctionData } from 'viem';
import { buildCaip10 } from './caipUtils';

export const FRONTEND_ATTESTATION_RECIPIENT = '0x0000000000000000000000000000000000000002';

export const prepareTags = (formData: Record<string, any>) => {
  const tagsObject: { [key: string]: any } = {};
  
  Object.entries(formData)
    .filter(([key, value]) => 
      key !== 'chain_id' && 
      key !== 'address' && 
      key !== 'attestation_network' && // Exclude attestation network from tags
      (value !== undefined && value !== '' && value !== null))
    .forEach(([key, value]) => {
      // Convert specific fields to integers
      if (key === 'erc20.decimals' || key === 'version') {
        tagsObject[key] = parseInt(value, 10);
      }
      // Format deployment_date to use space instead of T
      else if (key === 'deployment_date' && typeof value === 'string') {
        // Replace the 'T' with a space in the datetime format
        tagsObject[key] = value.replace('T', ' ');
      }
      // Ensure erc_type is always an array of strings or not included if empty
      else if (key === 'erc_type') {
        // If the value is a comma-separated string (which it should be now)
        if (typeof value === 'string' && value.trim() !== '') {
          const ercValues = value
            .split(',')
            .map(item => item.trim())
            .filter(item => item !== '');
            
          if (ercValues.length > 0) {
            tagsObject[key] = ercValues;
          }
        }
        // If it's somehow already an array, ensure all items are strings
        else if (Array.isArray(value)) {
          const validStrings = value
            .map(item => String(item))
            .filter(item => item !== null && item !== undefined && item !== '');
            
          if (validStrings.length > 0) {
            tagsObject[key] = validStrings;
          }
        }
        // If it's a single value and valid, convert to a string and put in an array
        else if (value !== null && value !== undefined && value !== '') {
          tagsObject[key] = [String(value)];
        }
        // If value is empty/null/undefined, don't add it to tagsObject at all
      }
      // Keep other fields as they are
      else {
        tagsObject[key] = value;
      }
    });
    
  return tagsObject;
};

export const prepareEncodedData = (
  chainId: string,
  address: string,
  tagsObject: Record<string, any>,
  attestationChainId?: number
) => {
  // Use the schema definition from the network config if available
  const schemaDefinition = attestationChainId 
    ? getNetworkConfig(attestationChainId).schemaDefinition 
    : getNetworkConfig(8453).schemaDefinition; // Default to Base
  
  const schemaEncoder = new SchemaEncoder(schemaDefinition);
  const caip10 = buildCaip10(chainId, address);
  
  return schemaEncoder.encodeData([
    { name: 'caip10', value: caip10, type: 'string' },
    { name: 'tags_json', value: JSON.stringify(tagsObject), type: 'string' }
  ]);
};

export const switchToAttestationNetwork = async (primaryWallet: any, chainId: SupportedChainId) => {
  try {
    await primaryWallet.switchNetwork(chainId);
  } catch (switchError: any) {
    const networkConfig = getNetworkConfig(chainId);
    console.error(`Failed to switch to ${networkConfig.name}:`, switchError);
    throw new Error(`Failed to switch to ${networkConfig.name}. Please switch manually in your wallet.`);
  }
};

// Legacy function for backward compatibility
export const switchToBaseNetwork = async (primaryWallet: any) => {
  return switchToAttestationNetwork(primaryWallet, 8453);
};

export const initializeEAS = async (primaryWallet: any, chainId?: SupportedChainId) => {
  // Use Dynamic's ethers integration to get provider and signer
  const provider = await getWeb3Provider(primaryWallet);
  const signer = await getSigner(primaryWallet);
  
  if (!provider || !signer) {
    throw new Error('Failed to get provider or signer from Dynamic wallet');
  }
  
  // Get the correct EAS contract address for the network
  // If no chainId provided, get it from the wallet
  let easContractAddress: string;
  if (chainId) {
    easContractAddress = getNetworkConfig(chainId).easContractAddress;
  } else {
    // Get current chain ID from wallet
    const walletClient = await primaryWallet.getWalletClient();
    const currentChainId = await walletClient.getChainId();
    
    if (!isSupportedAttestationChain(currentChainId)) {
      throw new Error(`Current network (Chain ID: ${currentChainId}) is not supported for attestations`);
    }
    
    easContractAddress = getNetworkConfig(currentChainId).easContractAddress;
  }
  
  // Initialize EAS SDK
  const eas = new EAS(easContractAddress, provider as unknown as any);
  eas.connect(signer);
  
  return { eas, signer, provider };
};

// Check if sponsored transactions are available (async to get real chain ID)
// Note: Coinbase paymaster only works on Base networks
export const canUseSponsoredTransaction = async (primaryWallet: any): Promise<boolean> => {
  if (!primaryWallet) return false;
  
  try {
    const walletName = primaryWallet?.connector?.name;
    // More secure wallet detection - check for exact matches
    const isCoinbaseSmartWallet = (
      walletName === 'Coinbase' || 
      walletName === 'Coinbase Smart Wallet' ||
      walletName === 'coinbase_smart_wallet' ||
      walletName?.toLowerCase() === 'coinbase'
    ) || false;
    
    // Get actual chain ID from wallet client
    const walletClient = await primaryWallet.getWalletClient();
    const chainId = await walletClient.getChainId();
    const isOnBaseNetwork = BASE_CHAIN_IDS.includes(chainId);
    
    return isCoinbaseSmartWallet && isOnBaseNetwork;
  } catch (error) {
    console.error('Failed to check sponsorship capabilities:', error);
    return false;
  }
};

// Coinbase Paymaster configuration (only works on Base networks)
const COINBASE_PAYMASTER_URL = process.env.NEXT_PUBLIC_COINBASE_PAYMASTER_URL || 'https://api.developer.coinbase.com/rpc/v1/base/hyKHUTPE7kd0VnvFqYsMiAUjvg1wshR3';

// Base network chain IDs that support Coinbase paymaster
const BASE_CHAIN_IDS = [8453, 84532]; // Base Mainnet and Base Sepolia

// Create sponsored attestation using Wagmi sendCalls
// Note: This only works on Base networks with Coinbase Smart Wallet
export const createSponsoredAttestation = async (
  primaryWallet: any, 
  attestationData: {
    schema: string;
    recipient: string;
    expirationTime: bigint;
    revocable: boolean;
    data: string;
  },
  chainId?: SupportedChainId
) => {
  if (!(await canUseSponsoredTransaction(primaryWallet))) {
    throw new Error('Sponsored transactions not available for this wallet/network');
  }

  // Get the EAS contract address for the current network
  const walletClient = await primaryWallet.getWalletClient();
  const currentChainId = chainId || await walletClient.getChainId();
  
  if (!isSupportedAttestationChain(currentChainId)) {
    throw new Error(`Unsupported network for attestations: ${currentChainId}`);
  }
  
  const easContractAddress = getNetworkConfig(currentChainId).easContractAddress;
  
  // Encode the EAS attest function call
  const encodedData = encodeFunctionData({
    abi: [
      {
        name: 'attest',
        type: 'function',
        inputs: [
          {
            name: 'request',
            type: 'tuple',
            components: [
              { name: 'schema', type: 'bytes32' },
              { name: 'data', type: 'tuple', components: [
                { name: 'recipient', type: 'address' },
                { name: 'expirationTime', type: 'uint64' },
                { name: 'revocable', type: 'bool' },
                { name: 'refUID', type: 'bytes32' },
                { name: 'data', type: 'bytes' },
                { name: 'value', type: 'uint256' }
              ]}
            ]
          }
        ],
        outputs: [{ name: '', type: 'bytes32' }]
      }
    ],
    functionName: 'attest',
    args: [{
      schema: attestationData.schema,
      data: {
        recipient: attestationData.recipient,
        expirationTime: attestationData.expirationTime,
        revocable: attestationData.revocable,
        refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
        data: attestationData.data,
        value: BigInt(0)
      }
    }]
  });

  // Use sendCalls with paymaster capabilities
  try {
    const result = await walletClient.sendCalls({
      calls: [{
        to: easContractAddress,
        data: encodedData,
        value: BigInt(0)
      }],
      capabilities: {
        paymasterService: {
          url: COINBASE_PAYMASTER_URL
        }
      }
    });
    
    return result;
  } catch (error) {
    console.error('Sponsored transaction failed:', error);
    throw error;
  }
};

// Create sponsored bulk attestation using Wagmi sendCalls
// Note: This only works on Base networks with Coinbase Smart Wallet
export const createSponsoredBulkAttestation = async (
  primaryWallet: any, 
  attestationsData: Array<{
    recipient: string;
    expirationTime: bigint;
    revocable: boolean;
    data: string;
  }>,
  schemaUID: string,
  chainId?: SupportedChainId
) => {
  if (!(await canUseSponsoredTransaction(primaryWallet))) {
    throw new Error('Sponsored transactions not available for this wallet/network');
  }

  // Get the EAS contract address for the current network
  const walletClient = await primaryWallet.getWalletClient();
  const currentChainId = chainId || await walletClient.getChainId();
  
  if (!isSupportedAttestationChain(currentChainId)) {
    throw new Error(`Unsupported network for attestations: ${currentChainId}`);
  }
  
  const easContractAddress = getNetworkConfig(currentChainId).easContractAddress;
  
  // Encode the EAS multiAttest function call
  const encodedData = encodeFunctionData({
    abi: [
      {
        name: 'multiAttest',
        type: 'function',
        inputs: [
          {
            name: 'multiRequests',
            type: 'tuple[]',
            components: [
              { name: 'schema', type: 'bytes32' },
              { name: 'data', type: 'tuple[]', components: [
                { name: 'recipient', type: 'address' },
                { name: 'expirationTime', type: 'uint64' },
                { name: 'revocable', type: 'bool' },
                { name: 'refUID', type: 'bytes32' },
                { name: 'data', type: 'bytes' },
                { name: 'value', type: 'uint256' }
              ]}
            ]
          }
        ],
        outputs: [{ name: '', type: 'bytes32[]' }]
      }
    ],
    functionName: 'multiAttest',
    args: [[{
      schema: schemaUID,
      data: attestationsData.map(attestation => ({
        recipient: attestation.recipient,
        expirationTime: attestation.expirationTime,
        revocable: attestation.revocable,
        refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
        data: attestation.data,
        value: BigInt(0)
      }))
    }]]
  });

  // Use sendCalls with paymaster capabilities
  try {
    const result = await walletClient.sendCalls({
      calls: [{
        to: easContractAddress,
        data: encodedData,
        value: BigInt(0)
      }],
      capabilities: {
        paymasterService: {
          url: COINBASE_PAYMASTER_URL
        }
      }
    });
    
    return result;
  } catch (error) {
    console.error('Sponsored bulk transaction failed:', error);
    throw error;
  }
};
