import { ChainData, ChainKey, UnlabeledContract } from '@/types/unlabeledContracts';

// Chain URLs configuration - matches the Python script
const CHAIN_BLOCKSPACE_URLS: Record<ChainKey, string> = {
  arbitrum: "https://api.growthepie.com/v1/chains/blockspace/arbitrum.json",
  polygon_zkevm: "https://api.growthepie.com/v1/chains/blockspace/polygon_zkevm.json",
  optimism: "https://api.growthepie.com/v1/chains/blockspace/optimism.json",
  zksync_era: "https://api.growthepie.com/v1/chains/blockspace/zksync_era.json",
  base: "https://api.growthepie.com/v1/chains/blockspace/base.json",
  zora: "https://api.growthepie.com/v1/chains/blockspace/zora.json",
  linea: "https://api.growthepie.com/v1/chains/blockspace/linea.json",
  scroll: "https://api.growthepie.com/v1/chains/blockspace/scroll.json",
  mantle: "https://api.growthepie.com/v1/chains/blockspace/mantle.json",
  mode: "https://api.growthepie.com/v1/chains/blockspace/mode.json",
  taiko: "https://api.growthepie.com/v1/chains/blockspace/taiko.json",
  swell: "https://api.growthepie.com/v1/chains/blockspace/swell.json",
  megaeth: "https://api.growthepie.com/v1/chains/blockspace/megaeth.json",
  polygon_pos: "https://api.growthepie.com/v1/chains/blockspace/polygon_pos.json"
};

// Time ranges to check
const TIME_RANGES = ['7d', '30d'];

/**
 * Fetches data for a specific chain from the API
 */
export async function fetchChainData(chain: ChainKey): Promise<ChainData> {
  const url = CHAIN_BLOCKSPACE_URLS[chain];
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching data for ${chain}:`, error);
    return {} as ChainData;
  }
}

/**
 * Analyzes chain data to extract top unlabeled contracts
 */
export function analyzeChainData(chainData: ChainData, chain: ChainKey): UnlabeledContract[] {
  // Use a map to track contract data by address
  const contractsMap = new Map<string, UnlabeledContract>();
  
  // Check if the data structure is as expected
  if (!chainData || !chainData.overview) {
    return [];
  }
  
  const overview = chainData.overview;
  
  for (const timeRange of TIME_RANGES) {
    if (!overview[timeRange]) continue;
    
    const rangeData = overview[timeRange];
    if (!rangeData.unlabeled) continue;
    
    const unlabeled = rangeData.unlabeled;
    const contracts = unlabeled.contracts?.data || [];
    const contractTypes = unlabeled.contracts?.types || [];
    
    // Skip if no contract data available
    if (!contracts.length || !contractTypes.length) continue;
    
    // Find indices for relevant contract fields
    const addrIdx = contractTypes.indexOf('address');
    const txCountIdx = contractTypes.indexOf('txcount_absolute');
    const gasFeesEthIdx = contractTypes.indexOf('gas_fees_absolute_eth');
    
    // Skip if we can't find the required fields
    if (addrIdx < 0 || txCountIdx < 0 || gasFeesEthIdx < 0) continue;
    
    // Extract contract details
    for (const contract of contracts) {
      // Preserve the original case of the address
      const address = contract[addrIdx];
      const txCount = contract[txCountIdx];
      const gasFeesEth = contract[gasFeesEthIdx];
      
      // Create the key for this contract (chain + address)
      const key = `${chain}-${address}`;
      
      // Check if we've already seen this contract
      if (contractsMap.has(key)) {
        const existing = contractsMap.get(key)!;
        
        // Update contract if it has higher transaction count,
        // or if it's from the 7d timeframe (more recent activity)
        if (txCount > existing.txCount || (timeRange === '7d' && existing.timeRange === '30d')) {
          contractsMap.set(key, {
            chain,
            address,
            txCount,
            gasFeesEth,
            timeRange,
            dayRange: timeRange === '7d' ? 7 : 30
          });
        }
      } else {
        // Add new contract to the map
        contractsMap.set(key, {
          chain,
          address,
          txCount,
          gasFeesEth,
          timeRange,
          dayRange: timeRange === '7d' ? 7 : 30
        });
      }
    }
  }
  
  // Convert map values to array, sort by transaction count and return top 10
  return Array.from(contractsMap.values())
    .sort((a, b) => b.txCount - a.txCount)
    .slice(0, 10);
}

/**
 * Fetches unlabeled contracts for all chains
 */
export async function fetchAllUnlabeledContracts(): Promise<Record<ChainKey, UnlabeledContract[]>> {
  const contractsByChain: Record<ChainKey, UnlabeledContract[]> = {} as Record<ChainKey, UnlabeledContract[]>;
  
  await Promise.all(
    Object.keys(CHAIN_BLOCKSPACE_URLS).map(async (chain) => {
      const chainKey = chain as ChainKey;
      const chainData = await fetchChainData(chainKey);
      const contracts = analyzeChainData(chainData, chainKey);
      contractsByChain[chainKey] = contracts;
    })
  );
  
  return contractsByChain;
}

/**
 * Helper function to convert address to a proper format
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  // Preserve the original case by removing toLowerCase()
  if (!address.startsWith('0x')) {
    address = `0x${address}`;
  }
  return address;
}

/**
 * Get top 10 unlabeled contracts for each chain
 * Returns them as a flattened array but maintains the per-chain limit
 */
export async function getTopUnlabeledContracts(): Promise<UnlabeledContract[]> {
  try {
    const contractsByChain = await fetchAllUnlabeledContracts();
    
    // Flatten the results while preserving chain-specific ordering
    return Object.values(contractsByChain).flat();
  } catch (error) {
    console.error("Error getting top unlabeled contracts:", error);
    return [];
  }
} 