import { ethers } from 'ethers';
import { CHAINS } from '../constants/chains';

export type Caip10Parts = {
  chainId: string;
  address: string;
  isKnownChain: boolean;
};

const normalizeChainId = (chainId: string): string | null => {
  const normalized = chainId.trim().toLowerCase();
  const matchingChain = CHAINS.find(chain => chain.caip2.toLowerCase() === normalized);
  return matchingChain ? matchingChain.caip2 : null;
};

export const parseCaip10 = (value: string): Caip10Parts | null => {
  if (!value) return null;
  const trimmed = value.trim();
  const parts = trimmed.split(':');
  if (parts.length < 3) return null;

  const chainIdCandidate = `${parts[0]}:${parts[1]}`;
  const address = parts.slice(2).join(':').trim();
  if (!address) return null;

  const normalizedChainId = normalizeChainId(chainIdCandidate);
  return {
    chainId: normalizedChainId ?? chainIdCandidate,
    address,
    isKnownChain: Boolean(normalizedChainId)
  };
};

export const buildCaip10 = (chainId: string, address: string): string => {
  const normalizedChainId = normalizeChainId(chainId) ?? chainId;
  const trimmedAddress = address.trim();
  let checksummedAddress = trimmedAddress;

  if (trimmedAddress.startsWith('0x') && trimmedAddress.length === 42) {
    try {
      checksummedAddress = ethers.getAddress(trimmedAddress);
    } catch {
      checksummedAddress = trimmedAddress;
    }
  }

  return `${normalizedChainId}:${checksummedAddress}`;
};
