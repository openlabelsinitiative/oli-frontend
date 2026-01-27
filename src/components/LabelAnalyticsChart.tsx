'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import LoadingAnimation from '@/components/LoadingAnimation';
import { CHAINS } from '@/constants/chains';
import yaml from 'js-yaml';

// Interface for tag definitions from YAML
interface TagDefinition {
  tag_id: string;
  name: string;
  description: string;
  type: string;
  creator: string;
  value_set?: any;
}

// Interface for the new API response structure
interface ChainTagApiResponse {
  data: {
    timestamp: number;
    attester: string;
    totals: {
      types: string[];
      values: Array<[string, string, number]>; // [chain_id, tag_id, row_count]
    };
  };
}

// Interface for attester API response
interface AttesterApiResponse {
  data: {
    timestamp: number;
    attester: string;
    totals: {
      types: string[];
      values: Array<[string, string, number]>; // [chain_id, tag_id, row_count]
    };
    latest_25_attestations: {
      types: string[];
      values: Array<[
        string, // id
        string, // attester
        string, // recipient
        boolean, // is_offchain
        boolean, // revoked
        string, // ipfs_hash
        string, // tx_id
        string, // decoded_data_json
        number, // time
        number, // time_created
        number  // revocation_time
      ]>;
    };
  };
}

// Interface for processed attestation data
interface ProcessedAttestation {
  id: string;
  attester: string;
  recipient: string;
  isOffchain: boolean;
  revoked: boolean;
  txId: string;
  decodedData: any;
  timeCreated: number;
}

interface BlockspaceCoverageData {
  chainName: string;
  labeledPercentage: number;
  totalTransactions: number;
  color: string;
}

const ARBITRUM_BASE_CHAIN_IDS = ['eip155:42161', 'eip155:42170'];

// Fetch blockspace coverage data from growthepie API
const fetchBlockspaceCoverage = async (): Promise<BlockspaceCoverageData[]> => {
  try {
    const response = await fetch('https://api.growthepie.com/v1/blockspace/overview.json');
    const data = await response.json();
    
    const timeframe = 'max';
    const results: BlockspaceCoverageData[] = [];
    
    // Get all available chains from the API response
    const availableChains = Object.keys(data.data?.chains || {});
    
    availableChains.forEach((chainKey) => {
      // Skip the 'all_l2s' aggregate
      if (chainKey === 'all_l2s') return;
      
      const chainData = data.data.chains[chainKey];
      const unlabeledTx = chainData.overview?.[timeframe]?.unlabeled?.data?.[2];
      const totalTx = chainData.totals?.[timeframe]?.data?.[2];
      
      if (unlabeledTx !== undefined && totalTx !== undefined && totalTx > 0) {
        const labeledPercentage = 100 * (1 - unlabeledTx / totalTx);
        
        // Get chain display name (capitalize first letter and handle special cases)
        let displayName = chainKey.charAt(0).toUpperCase() + chainKey.slice(1);
        if (chainKey === 'zksync_era') displayName = 'zkSync Era';
        if (chainKey === 'polygon_zkevm') displayName = 'Polygon zkEVM';
        if (chainKey === 'arbitrum_nova') displayName = 'Arbitrum Nova';
        if (chainKey === 'arbitrum_one') displayName = 'Arbitrum One';
        if (chainKey === 'op_bnb') displayName = 'opBNB';
        
        results.push({
          chainName: displayName,
          labeledPercentage,
          totalTransactions: totalTx,
          color: '' // Remove color since we won't use individual colors
        });
      }
    });
    
    return results.sort((a, b) => b.labeledPercentage - a.labeledPercentage);
  } catch (error) {
    console.error('Error fetching blockspace coverage:', error);
    return [];
  }
};

// Fetch and parse tag definitions from OLI repository
const fetchTagDefinitions = async (): Promise<TagDefinition[]> => {
  try {
    const response = await fetch('https://raw.githubusercontent.com/openlabelsinitiative/OLI/refs/heads/main/1_label_schema/tags/tag_definitions.yml');
    const yamlText = await response.text();
    
    // Parse YAML using js-yaml
    const parsedYaml = yaml.load(yamlText) as { tags: TagDefinition[] };
    
    // Extract tags from the nested structure
    return parsedYaml?.tags || [];
  } catch (error) {
    console.error('Error fetching tag definitions:', error);
    return [];
  }
};

// Fetch chain and tag data from the REST API
const fetchChainTagData = async (): Promise<ChainTagApiResponse> => {
  try {
    const response = await fetch('https://api.growthepie.com/v1/oli/analytics/totals_chain_tag.json');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching chain tag data:', error);
    throw error;
  }
};

// Fetch totals data from the REST API (for attestation counts)
const fetchTotalsData = async () => {
  try {
    const response = await fetch('https://api.growthepie.com/v1/oli/analytics/totals.json');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching totals data:', error);
    throw error;
  }
};

// Fetch attester data from the REST API
const fetchAttesterData = async (attesterAddress: string): Promise<AttesterApiResponse | null> => {
  if (!attesterAddress || attesterAddress.length < 10) {
    return null;
  }
  
  try {
    const cleanAddress = attesterAddress.replace('0x', '').toLowerCase();
    const response = await fetch(`https://api.growthepie.com/v1/oli/analytics/attester/${cleanAddress}.json`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // No data for this attester
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching attester data:', error);
    return null;
  }
};

interface LabelData {
  name: string;
  count: number;
  color: string;
}

interface ChainData {
  name: string;
  count: number;
  color: string;
}

const LabelAnalyticsChart: React.FC = () => {
  const [tagDefinitions, setTagDefinitions] = useState<TagDefinition[]>([]);
  const [chainTagData, setChainTagData] = useState<ChainTagApiResponse | null>(null);
  const [totalsData, setTotalsData] = useState<any>(null);
  const [selectedChain, setSelectedChain] = useState<string>('all');
  const [selectedTagId, setSelectedTagId] = useState<string>('all');
  const [selectedAttester, setSelectedAttester] = useState<string>('');
  const [arbitrumFocus, setArbitrumFocus] = useState<boolean>(false);
  const [attesterData, setAttesterData] = useState<AttesterApiResponse | null>(null);
  const [attesterLoading, setAttesterLoading] = useState<boolean>(false);
  const [blockspaceCoverageData, setBlockspaceCoverageData] = useState<BlockspaceCoverageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const arbitrumChainIds = useMemo(() => {
    const orbitArbitrumChains = CHAINS
      .filter(chain => chain.isOrbitChain && chain.orbitMetadata?.parentChain?.toLowerCase().includes('arbitrum'))
      .map(chain => chain.caip2);
    return new Set([...ARBITRUM_BASE_CHAIN_IDS, ...orbitArbitrumChains]);
  }, []);
  
  // Fetch all data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      console.log('Starting to load analytics data...');
      
      try {
        console.log('Fetching all data sources...');
        const [tags, chainTag, totals, blockspace] = await Promise.all([
          fetchTagDefinitions(),
          fetchChainTagData(),
          fetchTotalsData(),
          fetchBlockspaceCoverage()
        ]);
        
        console.log('Data fetched successfully:', {
          tagsCount: tags.length,
          chainTagHasData: !!chainTag?.data,
          totalsHasData: !!totals?.data,
          blockspaceCount: blockspace.length
        });
        
        setTagDefinitions(tags);
        setChainTagData(chainTag);
        setTotalsData(totals);
        setBlockspaceCoverageData(blockspace);
      } catch (err) {
        console.error('Error loading analytics data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Fetch attester data when selectedAttester changes
  useEffect(() => {
    const loadAttesterData = async () => {
      if (!selectedAttester.trim()) {
        setAttesterData(null);
        return;
      }

      setAttesterLoading(true);
      try {
        const data = await fetchAttesterData(selectedAttester);
        setAttesterData(data);
      } catch (err) {
        console.error('Error loading attester data:', err);
        setAttesterData(null);
      } finally {
        setAttesterLoading(false);
      }
    };

    loadAttesterData();
  }, [selectedAttester]);

  useEffect(() => {
    if (arbitrumFocus && selectedChain !== 'all' && !arbitrumChainIds.has(selectedChain)) {
      setSelectedChain('all');
    }
  }, [arbitrumFocus, selectedChain, arbitrumChainIds]);

  if (loading) {
    return <LoadingAnimation />;
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] p-8">
        <div className="text-red-500 text-center">
          <p className="font-semibold mb-2">Error loading label analytics</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!chainTagData || !totalsData || tagDefinitions.length === 0) {
    console.log('Debug - Data availability:', {
      chainTagData: !!chainTagData,
      totalsData: !!totalsData,
      tagDefinitionsLength: tagDefinitions.length,
      chainTagDataContent: chainTagData ? 'has data' : 'null',
      totalsDataContent: totalsData ? 'has data' : 'null'
    });
    
    return (
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] p-8">
        <div className="text-gray-500 text-center">
          <p className="font-semibold mb-2">No data available</p>
          <p className="text-sm">Unable to load analytics data</p>
          <p className="text-xs mt-2 text-gray-400">
            Debug: ChainTag: {chainTagData ? '✓' : '✗'}, 
            Totals: {totalsData ? '✓' : '✗'}, 
            Tags: {tagDefinitions.length}
          </p>
        </div>
      </div>
    );
  }

  return (
    <LabelAnalyticsContent 
      tagDefinitions={tagDefinitions}
      chainTagData={chainTagData}
      totalsData={totalsData}
      selectedChain={selectedChain}
      setSelectedChain={setSelectedChain}
      selectedTagId={selectedTagId}
      setSelectedTagId={setSelectedTagId}
      selectedAttester={selectedAttester}
      setSelectedAttester={setSelectedAttester}
      attesterData={attesterData}
      attesterLoading={attesterLoading}
      blockspaceCoverageData={blockspaceCoverageData}
      arbitrumFocus={arbitrumFocus}
      setArbitrumFocus={setArbitrumFocus}
      arbitrumChainIds={arbitrumChainIds}
    />
  );
};

// Separate component that handles the data processing and rendering
interface LabelAnalyticsContentProps {
  tagDefinitions: TagDefinition[];
  chainTagData: ChainTagApiResponse;
  totalsData: any;
  selectedChain: string;
  setSelectedChain: (chain: string) => void;
  selectedTagId: string;
  setSelectedTagId: (tagId: string) => void;
  selectedAttester: string;
  setSelectedAttester: (attester: string) => void;
  attesterData: AttesterApiResponse | null;
  attesterLoading: boolean;
  blockspaceCoverageData: BlockspaceCoverageData[];
  arbitrumFocus: boolean;
  setArbitrumFocus: React.Dispatch<React.SetStateAction<boolean>>;
  arbitrumChainIds: Set<string>;
}

const LabelAnalyticsContent: React.FC<LabelAnalyticsContentProps> = ({
  tagDefinitions,
  chainTagData,
  totalsData,
  selectedChain,
  setSelectedChain,
  selectedTagId,
  setSelectedTagId,
  selectedAttester,
  setSelectedAttester,
  attesterData,
  attesterLoading,
  blockspaceCoverageData,
  arbitrumFocus,
  setArbitrumFocus,
  arbitrumChainIds
}) => {
  // Color palettes
  const labelColors = [
    '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899', '#14B8A6'
  ];
  
  const chainColors = [
    '#1E40AF', '#7C3AED', '#059669', '#D97706', '#DC2626', '#4F46E5', '#C026D3', '#0D9488', '#B91C1C', '#7C2D12', '#365314', '#1E3A8A'
  ];

  const chainOptions = useMemo(() => {
    const filtered = arbitrumFocus
      ? CHAINS.filter(chain => arbitrumChainIds.has(chain.caip2))
      : CHAINS;
    return filtered;
  }, [arbitrumFocus, arbitrumChainIds]);

  const allChainsLabel = arbitrumFocus ? 'All Arbitrum Chains' : 'All Chains';

  const effectiveSelectedChain = useMemo(() => {
    if (selectedChain === 'all') return 'all';
    if (arbitrumFocus && !arbitrumChainIds.has(selectedChain)) {
      return 'all';
    }
    return selectedChain;
  }, [selectedChain, arbitrumFocus, arbitrumChainIds]);

  const selectedChainMetadata = chainOptions.find(chain => chain.caip2 === effectiveSelectedChain) 
    || CHAINS.find(chain => chain.caip2 === effectiveSelectedChain);
  const selectedChainLabel = selectedChainMetadata?.shortName || effectiveSelectedChain;

  const toggleArbitrumFocus = () => {
    setArbitrumFocus((prev) => {
      const next = !prev;
      if (next) {
        setSelectedChain('all');
      }
      return next;
    });
  };

  // Process the API data for charts
  const processApiData = () => {
    if (!chainTagData?.data?.totals?.values) {
      return {
        labelData: [],
        chainData: [],
        totalTagIds: 0,
        totalAttestations: 0,
        onchainAttestations: 0,
        offchainAttestations: 0
      };
    }

    const values = chainTagData.data.totals.values;
    
    // Group data by tag_id and chain_id
    const tagCounts: Record<string, number> = {};
    const chainCounts: Record<string, number> = {};
    let totalTagIdsAllChains = 0;

    values.forEach(([chainId, tagId, count]) => {
      totalTagIdsAllChains += count; // keep overall count unchanged

      const isInArbitrumEcosystem = !arbitrumFocus || arbitrumChainIds.has(chainId);
      if (!isInArbitrumEcosystem) {
        return;
      }

      // Count tags (filter by selected chain if needed)
      if (effectiveSelectedChain === 'all' || chainId === effectiveSelectedChain) {
        tagCounts[tagId] = (tagCounts[tagId] || 0) + count;
      }
      
      // Count chains (filter by selected tag if needed)
      if (selectedTagId === 'all' || tagId === selectedTagId) {
        chainCounts[chainId] = (chainCounts[chainId] || 0) + count;
      }
    });

    // Convert tag counts to chart data with proper names
    const labelData: LabelData[] = Object.entries(tagCounts)
      .map(([tagId, count], index) => {
        const tagDef = tagDefinitions.find(tag => tag.tag_id === tagId);
        return {
          name: tagDef?.name || tagId,
          count,
          color: labelColors[index % labelColors.length]
        };
      })
      .sort((a, b) => b.count - a.count);

    // Convert chain counts to chart data with proper names
    const chainData: ChainData[] = Object.entries(chainCounts)
      .map(([chainId, count], index) => {
        const chain = CHAINS.find(c => c.caip2 === chainId);
        return {
          name: chain?.shortName || chainId,
          count,
          color: chainColors[index % chainColors.length]
        };
      })
      .filter(item => item.count >= 10 || arbitrumFocus) // keep small chains when focusing on Arbitrum ecosystem
      .sort((a, b) => b.count - a.count);

    // Get totals data
    const totalAttestations = totalsData?.data?.count_attestations || 0;
    const onchainAttestations = totalsData?.data?.onchain_count_attestations || 0;
    const offchainAttestations = totalsData?.data?.offchain_count_attestations || 0;

    return {
      labelData,
      chainData,
      totalTagIds: totalTagIdsAllChains, // Always show total across all chains, regardless of selected chain
      totalAttestations,
      onchainAttestations,
      offchainAttestations
    };
  };

  const {
    labelData: processedLabelData,
    chainData: processedChainData,
    totalTagIds,
    totalAttestations,
    onchainAttestations,
    offchainAttestations
  } = processApiData();

  // Process attester data for bubble chart and attestations list
  const processAttesterData = () => {
    if (!attesterData?.data?.totals?.values) {
      return {
        attesterChartData: [],
        attestationsList: []
      };
    }

    const values = attesterData.data.totals.values;
    const bubbleColors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899', '#14B8A6'];

    // Create chart data for bar chart - aggregate by tag_id based on selected chain
    const tagCounts: Record<string, number> = {};
    
    values.forEach(([chainId, tagId, count]) => {
      const isInArbitrumEcosystem = !arbitrumFocus || arbitrumChainIds.has(chainId);
      if (!isInArbitrumEcosystem) {
        return;
      }

      // Filter by selected chain if specified
      if (effectiveSelectedChain === 'all' || chainId === effectiveSelectedChain) {
        tagCounts[tagId] = (tagCounts[tagId] || 0) + count;
      }
    });

    const attesterChartData = Object.entries(tagCounts)
      .map(([tagId, count], index) => ({
        name: tagId,
        count: count,
        color: bubbleColors[index % bubbleColors.length]
      }))
      .sort((a, b) => b.count - a.count);

    // Process attestations list
    const attestationsList: ProcessedAttestation[] = [];
    if (attesterData.data.latest_25_attestations?.values) {
      attesterData.data.latest_25_attestations.values.forEach(attestationRow => {
        try {
          const [id, attester, recipient, isOffchain, revoked, , txId, decodedDataJson, , timeCreated] = attestationRow;
          let decodedData;
          try {
            decodedData = JSON.parse(decodedDataJson);
          } catch {
            decodedData = { raw: decodedDataJson };
          }

          attestationsList.push({
            id,
            attester,
            recipient,
            isOffchain,
            revoked,
            txId,
            decodedData,
            timeCreated
          });
        } catch (error) {
          console.error('Error processing attestation:', error);
        }
      });
    }

    return {
      attesterChartData,
      attestationsList: attestationsList.slice(0, 10) // Show only first 10
    };
  };

  const { attesterChartData, attestationsList } = processAttesterData();

  // Process attestation distribution data for pie chart
  const processedAttestationDistribution = [
    {
      name: 'Offchain',
      count: offchainAttestations,
      color: '#8B5CF6'
    },
    {
      name: 'Onchain',
      count: onchainAttestations,
      color: '#3B82F6'
    }
  ].filter(item => item.count > 0);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-blue-600">
            Count: <span className="font-semibold">{payload[0].value.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const coverageDataToRender = useMemo(() => {
    if (!arbitrumFocus) {
      return blockspaceCoverageData;
    }

    return blockspaceCoverageData.filter(chain => 
      chain.chainName.toLowerCase().includes('arbitrum')
    );
  }, [blockspaceCoverageData, arbitrumFocus]);

  const coverageStats = useMemo(() => {
    if (!coverageDataToRender.length) {
      return { average: 0, best: 0, labeledTx: 0 };
    }

    const average = coverageDataToRender.reduce((sum, chain) => sum + chain.labeledPercentage, 0) / coverageDataToRender.length;
    const best = Math.max(...coverageDataToRender.map(c => c.labeledPercentage));
    const labeledTx = coverageDataToRender.reduce((sum, chain) => sum + (chain.totalTransactions * chain.labeledPercentage / 100), 0);

    return { average, best, labeledTx };
  }, [coverageDataToRender]);

  return (
    <div className="space-y-8">
      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] p-4">
          <div className="flex flex-col items-center justify-center h-full min-h-[60px]">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Attestations Count</h3>
            <p className="text-4xl font-bold text-blue-600">{totalAttestations.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-2">Number of attestations</p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] p-4">
          <div className="flex flex-col items-center justify-center h-full min-h-[60px]">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Tags Count</h3>
            <p className="text-4xl font-bold text-green-600">{totalTagIds.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-2">Number of tags assigned</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] p-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-600 mb-1">Attestation Type</h3>
            {processedAttestationDistribution.length === 0 ? (
              <div className="text-center">
                <p className="text-gray-500 text-sm">No distribution data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Bar Chart */}
                <div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden flex">
                  {processedAttestationDistribution.map((item: any, index: number) => {
                    const percentage = (item.count / totalAttestations) * 100;
                    return (
                      <div
                        key={index}
                        className="h-full flex items-center justify-center text-white font-medium text-sm transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: item.color,
                          minWidth: percentage > 10 ? 'auto' : '0'
                        }}
                        title={`${item.name}: ${item.count.toLocaleString()} (${percentage.toFixed(1)}%)`}
                      >
                        {percentage > 15 && (
                          <span>{percentage.toFixed(1)}%</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Legend */}
                <div className="flex justify-center space-x-6">
                  {processedAttestationDistribution.map((item: any, index: number) => {
                    return (
                      <div key={index} className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-sm font-medium text-gray-700">{item.name}</span>
                        <span className="ml-2 text-sm text-gray-500">
                          ({item.count.toLocaleString()})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Label Types Card */}
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {effectiveSelectedChain === 'all' ? (
                <>
                  Tag ID Breakdown ({processedLabelData.reduce((sum, item) => sum + item.count, 0).toLocaleString()})
                </>
              ) : (
                <>
                  Tag ID Breakdown - {selectedChainLabel} ({processedLabelData.reduce((sum, item) => sum + item.count, 0).toLocaleString()})
                </>
              )}
            </h2>
            <div className="flex justify-between items-center">
              <p className="text-gray-600">
                {effectiveSelectedChain === 'all' 
                  ? "Number of tags for each Tag ID."
                  : `Number of tags for each Tag ID on ${selectedChainLabel}.`
                }
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">
                    Filter by Blockchain:
                  </label>
                  <select
                    value={effectiveSelectedChain === 'all' ? 'all' : selectedChain}
                    onChange={(e) => setSelectedChain(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                  >
                    <option value="all">{allChainsLabel}</option>
                    {chainOptions.map((chain) => (
                      <option key={chain.id} value={chain.caip2}>
                        {chain.shortName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Arbitrum ecosystem</span>
                  <button
                    type="button"
                    onClick={toggleArbitrumFocus}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${arbitrumFocus ? 'bg-blue-600' : 'bg-gray-300'}`}
                    role="switch"
                    aria-checked={arbitrumFocus}
                    aria-label="Toggle Arbitrum ecosystem focus"
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${arbitrumFocus ? 'translate-x-5' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              </div>
              {arbitrumFocus && (
                <p className="text-xs text-blue-700 mt-2">
                  Showing Arbitrum One, Arbitrum Nova, and Arbitrum Orbit chains only.
                </p>
              )}
            </div>
          </div>

          <div>
            <ResponsiveContainer width="100%" height={800}>
              <BarChart 
                data={processedLabelData} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  tick={{ fontSize: 12 }}
                  width={150}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  fill="#3B82F6"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      {/* Blockchain Networks Card */}
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {selectedTagId === 'all' ? (
              <>
                Chain Breakdown ({processedChainData.reduce((sum, item) => sum + item.count, 0).toLocaleString()})
              </>
            ) : (
              <>
                Chain Breakdown - {selectedTagId} ({processedChainData.reduce((sum, item) => sum + item.count, 0).toLocaleString()})
              </>
            )}
          </h2>
            <div className="flex justify-between items-center">
              <p className="text-gray-600">
              {selectedTagId === 'all' 
                ? arbitrumFocus 
                  ? "Arbitrum One, Nova, and Orbit chain attestations (per chain)."
                  : "Number of tags assigned to each blockchain network (minimum of 10)."
                : arbitrumFocus
                  ? `Number of ${selectedTagId} tags across Arbitrum One, Nova, and Orbit chains (per chain).`
                  : `Number of ${selectedTagId} tags assigned to each blockchain network (minimum of 10).`
              }
            </p>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">
                Filter by Tag ID:
              </label>
              <select
                value={selectedTagId}
                onChange={(e) => setSelectedTagId(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
              >
                <option value="all">All Tags</option>
                {tagDefinitions.map((tag) => (
                  <option key={tag.tag_id} value={tag.tag_id}>
                    {tag.tag_id}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <ResponsiveContainer width="100%" height={800}>
            <BarChart 
              data={processedChainData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis 
                dataKey="name" 
                type="category"
                tick={{ fontSize: 12 }}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="count" 
                fill="#3B82F6"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Attester Breakdown Card */}
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Attester Breakdown
          </h2>
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              Analyze attestations by specific attester address.
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Filter by Chain:
                </label>
                <select
                  value={effectiveSelectedChain === 'all' ? 'all' : selectedChain}
                  onChange={(e) => setSelectedChain(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                  disabled={!selectedAttester.trim() || !attesterData}
                >
                  <option value="all">{allChainsLabel}</option>
                  {chainOptions.map((chain) => (
                    <option key={chain.id} value={chain.caip2}>
                      {chain.shortName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Attester Address:
                </label>
                <input
                  type="text"
                  value={selectedAttester}
                  onChange={(e) => setSelectedAttester(e.target.value)}
                  placeholder="0x123...abc"
                  className="px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-sm w-48"
                />
              </div>
            </div>
          </div>
        </div>

        {!selectedAttester.trim() ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Enter an attester address to view their attestation breakdown</p>
          </div>
        ) : attesterLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading attester data...</p>
          </div>
        ) : !attesterData ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">No attestations found for this address</p>
            <p className="text-xs text-gray-400">
              This means the address has made 0 attestations or is invalid. Data is updated daily at midnight UTC.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Tag Distribution */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {effectiveSelectedChain === 'all' ? (
                  <>
                    Tag Breakdown ({attesterChartData.reduce((sum, item) => sum + item.count, 0).toLocaleString()})
                  </>
                ) : (
                  <>
                    Tag Breakdown - {selectedChainLabel} ({attesterChartData.reduce((sum, item) => sum + item.count, 0).toLocaleString()})
                  </>
                )}
              </h3>
              <p className="text-gray-600 mb-6">
                {effectiveSelectedChain === 'all' 
                  ? "Number of attestations by tag type across all chains for this attester."
                  : `Number of attestations by tag type on ${selectedChainLabel} for this attester.`
                }
              </p>
              
              <div>
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart 
                    data={attesterChartData} 
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis 
                      dataKey="name" 
                      type="category"
                      tick={{ fontSize: 12 }}
                      width={200}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="count" 
                      fill="#3B82F6"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Latest Attestations */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Latest Attestations by {selectedAttester.substring(0, 6)}...{selectedAttester.substring(selectedAttester.length - 4)}
              </h3>
              <div className="space-y-4">
                {attestationsList.map((attestation, index) => {
                  // Parse the decoded data to extract tags
                  let tags = null;
                  let chainId = null;
                  
                  try {
                    if (Array.isArray(attestation.decodedData)) {
                      // Find chain_id field
                      const chainIdField = attestation.decodedData.find((field: any) => 
                        field.name === 'chain_id' && field.value?.value
                      );
                      if (chainIdField?.value?.value) {
                        chainId = chainIdField.value.value.replace('eip155:', '');
                      }
                      
                      // Find tags_json field
                      const tagsField = attestation.decodedData.find((field: any) => 
                        field.name === 'tags_json' && field.value?.value
                      );
                      if (tagsField?.value?.value) {
                        tags = JSON.parse(tagsField.value.value);
                      }
                    }
                  } catch (error) {
                    console.error('Error parsing attestation data:', error);
                  }

                  return (
                    <div 
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                      onClick={() => window.open(`https://base.easscan.org/attestation/view/${attestation.id}`, '_blank')}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center px-3 py-1 bg-gray-100 rounded-md border border-gray-200">
                            <span className="text-sm font-medium text-gray-500 mr-2">From:</span>
                            <code className="text-sm font-mono text-gray-500">
                              {attestation.attester.substring(0, 6)}...
                              {attestation.attester.substring(attestation.attester.length - 4)}
                            </code>
                          </div>
                          
                          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>

                          <div className="flex items-center px-3 py-1 bg-gray-100 rounded-md border border-gray-200">
                            <span className="text-sm font-medium text-gray-500 mr-2">To:</span>
                            <code className="text-sm font-mono text-gray-500">
                              {attestation.recipient.substring(0, 6)}...
                              {attestation.recipient.substring(attestation.recipient.length - 4)}
                            </code>
                          </div>
                          
                          {chainId && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">
                              Chain {chainId}
                            </span>
                          )}
                          
                          {attestation.isOffchain && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-600 rounded-full">
                              Offchain
                            </span>
                          )}
                          
                          {attestation.revoked && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-red-50 text-red-600 rounded-full">
                              Revoked
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          {new Date(attestation.timeCreated * 1000).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      {tags && (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(tags).map(([key, value]) => (
                            <div 
                              key={key}
                              className="inline-flex items-center px-3 py-1 rounded-md bg-indigo-50 border border-indigo-100"
                            >
                              <span className="text-xs font-medium text-gray-500 mr-2">{key}:</span>
                              <span className="text-sm text-indigo-700">
                                {value === null 
                                  ? 'null'
                                  : typeof value === 'boolean'
                                    ? String(value)
                                    : typeof value === 'object'
                                      ? JSON.stringify(value)
                                      : String(value)
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Blockspace Coverage Card */}
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Coverage
          </h2>
          <p className="text-gray-600">
            Percentage of all transactions per chain where the destination address has an assigned usage_category tag.
          </p>
        </div>

        <div>
          {coverageDataToRender.length === 0 ? (
            <div className="flex justify-center items-center h-96">
              <span className="text-gray-500">No blockspace coverage data available</span>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Summary Stats */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Coverage Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {coverageStats.average.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">Average Coverage</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {coverageStats.best.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">Best Coverage</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {coverageStats.labeledTx.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Transactions Labeled</p>
                  </div>
                </div>
              </div>

              {coverageDataToRender.map((chain) => (
                <div key={chain.chainName} className="group hover:bg-gray-50 rounded-lg p-2.5 transition-colors">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-900">{chain.chainName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900">
                        {chain.labeledPercentage.toFixed(1)}%
                      </span>
                      <p className="text-xs text-gray-500">
                        {chain.totalTransactions.toLocaleString()} total txs
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.min(chain.labeledPercentage, 100)}%`
                      }}
                    ></div>
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    {(chain.totalTransactions * chain.labeledPercentage / 100).toLocaleString()} labeled transactions
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabelAnalyticsChart;
