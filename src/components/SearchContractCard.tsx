'use client';

import { useState, useEffect, useCallback } from 'react';
import { Attestation, searchAttestations } from '@/services/attestationService';
import { fetchLabelsForAddress, type LabelItem } from '@/services/addressSearchService';
import { CHAINS } from '@/constants/chains';
import { resolveEnsName, getEnscribeUrl, EnsState } from '@/utils/ens';

interface Tag {
  id: string;
  name: string;
  category: string;
  createdAt: number;
  rawValue: unknown;
}

interface ParsedAttestation {
  attester: string;
  timeCreated: number;
  txid: string;
  isOffchain: boolean;
  revoked: boolean;
  tags: Tag[];
  chainId?: string;
  raw: Attestation;
}

interface ContractMetadata {
  isContract: boolean;
  contractName?: string;
  deploymentTx?: string;
  deployerAddress?: string;
  deploymentDate?: string;
  ownerProject?: string;
  usageCategory?: string;
}

interface GrowthePieData {
  name?: string;
  owner_project?: string;
  owner_project_clear?: string;
  usage_category?: string;
  txcount?: number;
  gas_fees_usd?: number;
  daa?: number;
  chains?: string[];
  allChainData?: Array<{
    chain: string;
    chain_id?: string;
    name?: string;
    owner_project?: string;
    owner_project_clear?: string;
    usage_category?: string;
    txcount?: number;
    gas_fees_usd?: number;
    daa?: number;
  }>;
}

interface SearchContractCardProps {
  address: string;
  attestations: Attestation[];
  onAttest?: () => void;
  onSelectAttestation?: (attestation: ParsedAttestation) => void;
  enableLabelsLookup?: boolean;
  labelChainFilter?: string;
  groupLabelsByAttester?: boolean;
}

const GROWTHEPIE_ATTESTER = '0xA725646c05e6Bb813d98C5aBB4E72DF4bcF00B56';

// Helper function to get chain colors
const getChainColors = (chainName: string) => {
  const normalizedChainName = chainName.toLowerCase().replace('_', '');
  const chain = CHAINS.find(c => 
    c.id === normalizedChainName || 
    c.name.toLowerCase().replace(/\s+/g, '') === normalizedChainName ||
    c.shortName.toLowerCase().replace(/\s+/g, '') === normalizedChainName
  );
  
  if (chain) {
    return {
      background: `linear-gradient(135deg, ${chain.colors.light[0]}20, ${chain.colors.light[1]}10)`,
      border: `${chain.colors.light[0]}40`,
      text: chain.colors.light[0],
      accent: chain.colors.light[0]
    };
  }
  
  // Default colors if chain not found
  return {
    background: 'linear-gradient(135deg, #f3f4f620, #e5e7eb10)',
    border: '#e5e7eb',
    text: '#6b7280',
    accent: '#6b7280'
  };
};

const SearchContractCard: React.FC<SearchContractCardProps> = ({ 
  address, 
  attestations, 
  onAttest,
  onSelectAttestation,
  enableLabelsLookup = false,
  labelChainFilter,
  groupLabelsByAttester = false
}) => {
  const [copied, setCopied] = useState(false);
  const [growthePieData, setGrowthePieData] = useState<GrowthePieData | null>(null);
  const [expandedAttestation, setExpandedAttestation] = useState<string | null>(null);
  const [showAllAttestations, setShowAllAttestations] = useState(false);
  const [showChainMatches, setShowChainMatches] = useState(false);
  const [labelsLoading, setLabelsLoading] = useState(false);
  const [labelsError, setLabelsError] = useState('');
  const [labels, setLabels] = useState<LabelItem[]>([]);
    const [ensState, setEnsState] = useState<EnsState>({
    resolution: null,
    loading: false,
    error: null
  });
  const [attestationMetadataOverrides, setAttestationMetadataOverrides] = useState<Record<string, Attestation>>({});
  const [attestationMetadataLoading, setAttestationMetadataLoading] = useState<Record<string, boolean>>({});
  const [attestationMetadataCache, setAttestationMetadataCache] = useState<Record<string, Attestation[]>>({});
  const ensResolution = ensState.resolution;
  const ensName = ensResolution?.name || null;

  // Check if any attestation is from growthepie
  const hasGrowthePieAttestation = attestations.some(
    attestation => attestation.attester.toLowerCase() === GROWTHEPIE_ATTESTER.toLowerCase()
  );

  const getTagValue = (attestation: Attestation, key: string): unknown => {
    const tagsJson = attestation.tags_json as Record<string, unknown> | null | undefined;
    if (tagsJson && Object.prototype.hasOwnProperty.call(tagsJson, key)) {
      return tagsJson[key];
    }
    return (attestation as Record<string, unknown>)[key];
  };

  const BASE_FIELDS = new Set([
    'attester',
    'expirationTime',
    'id',
    'ipfsHash',
    'isOffchain',
    'recipient',
    'refUID',
    'revocable',
    'revocationTime',
    'revoked',
    'time',
    'timeCreated',
    'txid',
    'schema_info',
    'uid',
    'time_iso',
    'tags_json',
    'chain_id',
    '_parsing_error'
  ]);

  const buildTagsFromAttestation = (attestation: Attestation): Tag[] => {
    const tags: Tag[] = [];
    const tagsJson = attestation.tags_json as Record<string, unknown> | null | undefined;

    const formatValue = (value: unknown) => {
      if (value === null) return 'null';
      if (Array.isArray(value)) return value.map(item => String(item)).join(', ');
      if (typeof value === 'object') return JSON.stringify(value);
      if (typeof value === 'string') {
        return value.length > 30 ? `${value.slice(0, 30)}...` : value;
      }
      return String(value);
    };

    if (tagsJson && typeof tagsJson === 'object' && !Array.isArray(tagsJson)) {
      Object.entries(tagsJson).forEach(([key, value]) => {
        tags.push({
          id: `${attestation.txid || attestation.timeCreated}-${key}`,
          name: `${key}: ${formatValue(value)}`,
          category: 'Contract Tag',
          createdAt: Number(attestation.timeCreated),
          rawValue: value
        });
      });
      return tags;
    }

    Object.entries(attestation).forEach(([key, value]) => {
      if (BASE_FIELDS.has(key)) return;
      tags.push({
        id: `${attestation.txid || attestation.timeCreated}-${key}`,
        name: `${key}: ${formatValue(value)}`,
        category: 'Attestation Field',
        createdAt: Number(attestation.timeCreated),
        rawValue: value
      });
    });

    return tags;
  };

  // Parse contract metadata from attestations
  const getContractMetadata = (): ContractMetadata => {
    return attestations.reduce<ContractMetadata>((metadata, attestation) => {
      const isContractTag = getTagValue(attestation, 'is_contract');
      if (isContractTag === true || isContractTag === 'true') {
        metadata.isContract = true;
      }

      const contractName = getTagValue(attestation, 'contract_name');
      if (typeof contractName === 'string') {
        metadata.contractName = contractName;
      }

      const deploymentTx = getTagValue(attestation, 'deployment_tx');
      if (typeof deploymentTx === 'string') {
        metadata.deploymentTx = deploymentTx;
      }

      const deployerAddress = getTagValue(attestation, 'deployer_address');
      if (typeof deployerAddress === 'string') {
        metadata.deployerAddress = deployerAddress;
      }

      const deploymentDate = getTagValue(attestation, 'deployment_date');
      if (typeof deploymentDate === 'string') {
        metadata.deploymentDate = deploymentDate;
      }

      const ownerProject = getTagValue(attestation, 'owner_project');
      if (typeof ownerProject === 'string') {
        metadata.ownerProject = ownerProject;
      }

      const usageCategory = getTagValue(attestation, 'usage_category');
      if (typeof usageCategory === 'string') {
        metadata.usageCategory = usageCategory;
      }

      return metadata;
    }, {
      isContract: false,
      contractName: undefined,
      deploymentTx: undefined,
      deployerAddress: undefined,
      deploymentDate: undefined,
      ownerProject: undefined,
      usageCategory: undefined
    });
  };

  const contractMetadata = getContractMetadata();

  // Get chain information from attestations
  const getChainFromAttestations = () => {
    for (const attestation of attestations) {
      const chainId = attestation.chain_id;
      if (typeof chainId === 'string') {
        const chain = CHAINS.find(c => c.caip2 === chainId);
        if (chain) {
          return chain;
        }
      }
    }
    return null;
  };

  const chainMetadata = getChainFromAttestations();

  const effectiveAttestations = attestations.map(attestation => {
    return attestationMetadataOverrides[attestation.txid] ?? attestation;
  });

  const labelTagsByAttester = (() => {
    if (!groupLabelsByAttester || labels.length === 0) {
      return new Map<string, Tag[]>();
    }

    const grouped = new Map<string, Tag[]>();
    labels.forEach(label => {
      const attesterKey = label.attester ? label.attester.toLowerCase() : 'unknown';
      const createdAt = Number.isNaN(Date.parse(label.time))
        ? Math.floor(Date.now() / 1000)
        : Math.floor(Date.parse(label.time) / 1000);
      const tag: Tag = {
        id: `${label.tag_id}-${label.tag_value}-${label.time}-${attesterKey}`,
        name: `${label.tag_id}: ${label.tag_value}`,
        category: 'Label',
        createdAt,
        rawValue: label.tag_value
      };
      const existing = grouped.get(attesterKey) ?? [];
      existing.push(tag);
      grouped.set(attesterKey, existing);
    });

    grouped.forEach((items, key) => {
      grouped.set(
        key,
        items.sort((a, b) => b.createdAt - a.createdAt)
      );
    });

    return grouped;
  })();

  const mergeLabelTags = (tags: Tag[], labelTags: Tag[]) => {
    const seen = new Set<string>();

    const tagKey = (tag: Tag) => {
      const parts = tag.name.split(':');
      const key = parts[0]?.trim() || '';
      const value = parts.slice(1).join(':').trim();
      return `${key}:${value.toLowerCase()}`;
    };

    tags.forEach(tag => {
      seen.add(tagKey(tag));
    });

    const merged = [...tags];
    labelTags.forEach(tag => {
      const key = tagKey(tag);
      if (!seen.has(key)) {
        merged.push(tag);
        seen.add(key);
      }
    });

    return merged;
  };

  // Parse attestations with full metadata
  const parsedAttestations: ParsedAttestation[] = (() => {
    const parsed = effectiveAttestations.map(attestation => {
      return {
        attester: attestation.attester,
        timeCreated: Number(attestation.timeCreated),
        txid: attestation.txid,
        isOffchain: attestation.isOffchain,
        revoked: attestation.revoked,
        tags: buildTagsFromAttestation(attestation),
        chainId: attestation.chain_id || undefined,
        raw: attestation
      };
    });

    if (!groupLabelsByAttester || labelTagsByAttester.size === 0) {
      return parsed;
    }

    const assignedAttesters = new Set<string>();

    return parsed.map(attestation => {
      const attesterKey = attestation.attester.toLowerCase();
      if (assignedAttesters.has(attesterKey)) {
        return attestation;
      }

      const labelTags = labelTagsByAttester.get(attesterKey);
      if (!labelTags || labelTags.length === 0) {
        return attestation;
      }

      assignedAttesters.add(attesterKey);

      return {
        ...attestation,
        tags: mergeLabelTags(attestation.tags, labelTags)
      };
    });
  })();

  const getChainName = useCallback(() => {
    if (growthePieData?.chains && growthePieData.chains.length > 1) {
      return `${growthePieData.chains.length} Chains`;
    }
    if (growthePieData?.chains && growthePieData.chains.length === 1) {
      const chainName = growthePieData.chains[0];
      return chainName.charAt(0).toUpperCase() + chainName.slice(1).replace('_', ' ');
    }
    return chainMetadata?.name || 'Multiple Chains';
  }, [growthePieData, chainMetadata]);


  // Fetch growthepie data if we have a growthepie attestation
  useEffect(() => {
    if (hasGrowthePieAttestation && !growthePieData) {
      fetch('https://api.growthepie.com/v1/labels/full.json')
        .then(response => response.json())
        .then(data => {
          if (data.data && data.data.data) {
            // Find all entries for this address across all chains
            const allAddressData = data.data.data.filter((item: any[]) => 
              item[0] && item[0].toLowerCase() === address.toLowerCase()
            );
            
            if (allAddressData.length > 0 && data.data.types) {
              const types = data.data.types;
              const nameIndex = types.indexOf('name');
              const chainIndex = types.indexOf('origin_key');
              const chainIdIndex = types.indexOf('chain_id');
              const ownerProjectIndex = types.indexOf('owner_project');
              const ownerProjectClearIndex = types.indexOf('owner_project_clear');
              const usageCategoryIndex = types.indexOf('usage_category');
              const txCountIndex = types.indexOf('txcount');
              const gasFeesIndex = types.indexOf('gas_fees_usd');
              const daaIndex = types.indexOf('daa');
              
              // Aggregate data across all chains
              let totalTxCount = 0;
              let totalGasFees = 0;
              let totalDaa = 0;
              const chains = new Set<string>();
              const allChainData: any[] = [];
              
              // Get the primary data (first entry or most complete entry)
              const primaryData = allAddressData[0];
              
              allAddressData.forEach((contractData: any[]) => {
                const chainName = chainIndex >= 0 ? contractData[chainIndex] : 'unknown';
                const chainId = chainIdIndex >= 0 ? contractData[chainIdIndex] : undefined;
                chains.add(chainName);
                
                const txCount = txCountIndex >= 0 ? (contractData[txCountIndex] || 0) : 0;
                const gasFees = gasFeesIndex >= 0 ? (contractData[gasFeesIndex] || 0) : 0;
                const daa = daaIndex >= 0 ? (contractData[daaIndex] || 0) : 0;
                
                totalTxCount += Number(txCount);
                totalGasFees += Number(gasFees);
                totalDaa += Number(daa);
                
                allChainData.push({
                  chain: chainName,
                  chain_id: chainId,
                  name: nameIndex >= 0 ? contractData[nameIndex] : undefined,
                  owner_project: ownerProjectIndex >= 0 ? contractData[ownerProjectIndex] : undefined,
                  owner_project_clear: ownerProjectClearIndex >= 0 ? contractData[ownerProjectClearIndex] : undefined,
                  usage_category: usageCategoryIndex >= 0 ? contractData[usageCategoryIndex] : undefined,
                  txcount: txCount,
                  gas_fees_usd: gasFees,
                  daa: daa,
                });
              });
              
              setGrowthePieData({
                name: nameIndex >= 0 ? primaryData[nameIndex] : undefined,
                owner_project: ownerProjectIndex >= 0 ? primaryData[ownerProjectIndex] : undefined,
                owner_project_clear: ownerProjectClearIndex >= 0 ? primaryData[ownerProjectClearIndex] : undefined,
                usage_category: usageCategoryIndex >= 0 ? primaryData[usageCategoryIndex] : undefined,
                txcount: totalTxCount,
                gas_fees_usd: totalGasFees,
                daa: totalDaa,
                chains: Array.from(chains),
                allChainData: allChainData,
              });
            }
          }
        })
        .catch(error => {
          console.error('Error fetching growthepie data:', error);
        });
    }
  }, [hasGrowthePieAttestation, address, growthePieData]);

  useEffect(() => {
    if (!enableLabelsLookup) return;
    setLabels([]);
    setLabelsError('');
    setLabelsLoading(false);
  }, [enableLabelsLookup, labelChainFilter, address]);

  useEffect(() => {
    if (!enableLabelsLookup || !groupLabelsByAttester) return;

    const loadLabels = async () => {
      setLabelsLoading(true);
      setLabelsError('');
      try {
        const response = await fetchLabelsForAddress({
          address,
          chainId: labelChainFilter || undefined
        });
        setLabels(response.labels);
      } catch (error) {
        setLabelsError(error instanceof Error ? error.message : 'Failed to load labels');
        setLabels([]);
      } finally {
        setLabelsLoading(false);
      }
    };

    loadLabels();
  }, [address, enableLabelsLookup, groupLabelsByAttester, labelChainFilter]);

  const resolvedChainId = labelChainFilter || attestations.find(attestation => attestation.chain_id)?.chain_id;
  const isEvmChain = resolvedChainId?.toLowerCase().startsWith('eip155:') ?? false;

  useEffect(() => {
    if (!isEvmChain) {
      setEnsState({ resolution: null, loading: false, error: null });
      return;
    }

    const fetchEnsName = async () => {
      setEnsState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const chainName = getChainName().toLowerCase();
        const resolution = await resolveEnsName(address, chainName);
        setEnsState({
          resolution,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('ENS resolution failed:', error);
        setEnsState({
          resolution: null,
          loading: false,
          error: error instanceof Error ? error.message : 'ENS resolution failed'
        });
      }
    };

    fetchEnsName();
  }, [address, getChainName, isEvmChain]);

  const normalizeAddress = (addr: string): string => {
    if (!addr) return '';
    if (addr.startsWith('0x')) return addr;
    if (isEvmChain && /^[a-fA-F0-9]{40}$/.test(addr)) {
      return `0x${addr}`;
    }
    return addr;
  };

  const formatFullAddress = (addr: string): string => {
    return normalizeAddress(addr);
  };

  const formatShortAddress = (addr: string): string => {
    const normalized = normalizeAddress(addr);
    if (!normalized) return '';
    return normalized.length > 12 ? `${normalized.slice(0, 6)}...${normalized.slice(-4)}` : normalized;
  };


  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };


  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const fullAddress = formatFullAddress(address);

  // Get chain metadata or use default
  const getSubtleGradient = (variant: 'header' | 'accent' = 'header') => {
    // Use standard multichain gradient for multichain addresses
    if (isMultichain()) {
      if (variant === 'header') {
        return 'linear-gradient(135deg, rgba(99, 102, 241, 0.85), rgba(139, 69, 19, 0.75) 25%, rgba(220, 38, 127, 0.8) 50%, rgba(59, 130, 246, 0.75) 75%, rgba(168, 85, 247, 0.85) 100%)';
      }
      return 'linear-gradient(to right, rgba(99, 102, 241, 0.6), rgba(220, 38, 127, 0.8), rgba(168, 85, 247, 0.6))';
    }
    
    if (!chainMetadata) {
      return contractMetadata.isContract 
        ? 'linear-gradient(to right, rgba(96, 165, 250, 0.9), rgba(147, 51, 234, 0.8), rgba(236, 72, 153, 0.9))'
        : 'linear-gradient(to right, rgba(34, 197, 94, 0.9), rgba(59, 130, 246, 0.8), rgba(168, 85, 247, 0.9))';
    }
    
    const [color1, color2] = chainMetadata.colors.dark;
    const baseColor1 = color1;
    const baseColor2 = color2 || color1;

    const hexToRgba = (hex: string, opacity: number) => {
      const cleanHex = hex.replace('#', '');
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    if (variant === 'header') {
      return `linear-gradient(135deg, 
        ${hexToRgba(baseColor1, 0.85)}, 
        ${hexToRgba(baseColor2 || baseColor1, 0.75)} 50%,
        ${hexToRgba(baseColor1, 0.85)} 100%
      )`;
    }
    
    return `linear-gradient(to right,
      ${hexToRgba(baseColor1, 0.6)},
      ${hexToRgba(baseColor2, 0.8)},
      ${hexToRgba(baseColor1, 0.6)}
    )`;
  };



  const isMultichain = () => {
    return growthePieData?.chains && growthePieData.chains.length > 1;
  };

  const getEasScanUrl = () => {
    // Default to Base chain for EAS scan
    const defaultChain = chainMetadata?.name?.toLowerCase() === 'base' ? 'base' : 'base';
    return `https://${defaultChain}.easscan.org/address/${fullAddress}`;
  };

  const toggleAttestation = (txid: string) => {
    setExpandedAttestation(expandedAttestation === txid ? null : txid);
  };

  const shouldShowLabelStatus = enableLabelsLookup && groupLabelsByAttester;

  const loadAttestationMetadata = useCallback(async (attestation: ParsedAttestation) => {
    const placeholderKey = attestation.txid;
    if (attestationMetadataLoading[placeholderKey]) return;

    setAttestationMetadataLoading(prev => ({ ...prev, [placeholderKey]: true }));

    try {
      const cacheKey = attestation.chainId || 'all';
      const cached = attestationMetadataCache[cacheKey];
      const fullAttestations = cached ?? await searchAttestations({
        recipient: address,
        chainId: attestation.chainId,
        limit: 100
      });

      if (!cached) {
        setAttestationMetadataCache(prev => ({ ...prev, [cacheKey]: fullAttestations }));
      }

      const match = fullAttestations.find(item => {
        const sameAttester = item.attester.toLowerCase() === attestation.attester.toLowerCase();
        const sameChain = (item.chain_id || undefined) === attestation.chainId;
        const timeCreated = Number(item.timeCreated);
        const timeDiff = Math.abs(timeCreated - attestation.timeCreated);
        return sameAttester && sameChain && timeDiff <= 5;
      });

      if (match) {
        setAttestationMetadataOverrides(prev => ({
          ...prev,
          [placeholderKey]: match
        }));
      }
    } catch (error) {
      console.error('Failed to fetch attestation metadata:', error);
    } finally {
      setAttestationMetadataLoading(prev => ({ ...prev, [placeholderKey]: false }));
    }
  }, [address, attestationMetadataCache, attestationMetadataLoading]);

  useEffect(() => {
    if (!groupLabelsByAttester) return;

    const placeholders = parsedAttestations.filter(attestation => attestation.txid.startsWith('search-'));
    placeholders.slice(0, 2).forEach(attestation => {
      if (attestationMetadataOverrides[attestation.txid] || attestationMetadataLoading[attestation.txid]) {
        return;
      }
      loadAttestationMetadata(attestation);
    });
  }, [attestationMetadataLoading, attestationMetadataOverrides, groupLabelsByAttester, loadAttestationMetadata, parsedAttestations]);

  return (
    <div 
      className="contract-card bg-white border border-gray-200 rounded-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.05)] hover:shadow-lg transition-all duration-200"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.08'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3Cpath d='M6 5V0H5v5H0v1h5v94h1V6h94V5H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}
    >
      {/* Document header */}
      <div 
        className="px-4 py-2 flex justify-between items-center backdrop-blur-sm"
        style={{
          background: getSubtleGradient('header')
        }}
      >
        <div className="flex items-center space-x-2">
          <span className="font-serif text-white text-xs tracking-wider">
            {isMultichain() ? 'MULTICHAIN ADDRESS' : (contractMetadata.isContract || contractMetadata.contractName ? 'SMART CONTRACT' : 'ADDRESS')}
          </span>
          {hasGrowthePieAttestation && (
            <span className="text-white text-xs font-medium flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Validated by growthepie
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-white font-serif italic">{getChainName()}</div>    
          <span className="text-white bg-white/20 rounded-md px-2 py-1 text-xs">
            {attestations.length} attestation{attestations.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 pb-4 text-sm pt-5">
        <div className="space-y-5">

          <div className="font-mono mb-5 flex items-center">
            <div className="bg-white border border-gray-200 rounded px-2 py-1 text-gray-800 flex-grow flex items-center justify-between">
              <div className="flex items-center">
                <a
                  href={getEnscribeUrl(fullAddress, getChainName().toLowerCase(), ensName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="select-all"
                >
                  {ensName || fullAddress}
                </a>
                                  {(ensName || ensState.loading) && (
                    <div className="flex items-center">
                      {ensState.loading && (
                        <div className="group relative ml-2">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
                            <div className="absolute inset-0 w-4 h-4 rounded-full border-2 border-transparent border-t-white border-r-white animate-spin"></div>
                          </div>
                          <div className="invisible group-hover:visible absolute z-50 w-64 p-4 mt-2 text-sm bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-xl -left-1/2 transform -translate-x-1/2 transition-all duration-300">
                            <div className="flex items-center mb-2">
                              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 mr-2 animate-pulse"></div>
                              <span className="font-medium text-gray-700">Resolving ENS...</span>
                            </div>
                            <p className="text-gray-600 text-xs leading-relaxed">Checking multiple resolution methods for the most accurate ENS name.</p>
                          </div>
                        </div>
                      )}
                      
                                             {ensResolution?.method === 'primary' && (
                         <div className="group relative ml-2">
                           <div className="relative">
                             <svg className="w-4 h-4 text-emerald-500 transition-all duration-200 hover:text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                             </svg>
                           </div>
                           <div className="invisible group-hover:visible absolute z-50 w-64 mt-2 -left-1/2 transform -translate-x-1/2 transition-all duration-200 opacity-0 group-hover:opacity-100">
                             <div className="bg-white/95 backdrop-blur-sm border border-emerald-200/60 rounded-lg shadow-lg overflow-hidden">
                               <div className="p-2.5">
                                 <div className="flex items-center mb-1">
                                   <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center mr-2">
                                     <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                       <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                     </svg>
                                   </div>
                                   <div>
                                     <div className="font-medium text-emerald-800 text-sm">Reverse Resolved ENS</div>
                                     <div className="text-emerald-600 text-xs">Verified by owner</div>
                                   </div>
                                 </div>
                               </div>
                               <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white border border-emerald-200/60 rotate-45"></div>
                             </div>
                           </div>
                         </div>
                       )}
                      
                      {ensResolution?.method === 'l2' && (
                        <div className="group relative ml-2.5">
                          <div className="relative">
                          <svg className="w-4 h-4 text-blue-500 transition-all duration-200 hover:text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                             </svg> 
                          </div>
                          <div className="invisible group-hover:visible absolute z-50 w-64 mt-4 -left-1/2 transform -translate-x-1/2 transition-all duration-200 opacity-0 group-hover:opacity-100">
                            <div className="bg-white/95 backdrop-blur-sm border border-blue-200/60 rounded-lg shadow-lg overflow-hidden">
                              <div className="p-2.5">
                                <div className="flex items-center mb-1">
                                   <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center mr-3">
                                     <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                     </svg>
                                   </div>
                                  <div>
                                    <div className="font-medium text-blue-800 text-sm">Reverse Resolved ENS</div>
                                    <div className="text-blue-600 text-xs">Chain-specific resolution</div>
                                  </div>
                                </div>
                              </div>
                              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white border border-blue-200/60 rotate-45"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                        {ensResolution?.method === 'subgraph' && (
                         <div className="group relative ml-2.5">
                           <div className="relative">
                             <svg className="w-4 h-4 text-amber-500 transition-all duration-200 hover:text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                               <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-3a1 1 0 001 1h.01a1 1 0 100-2H10a1 1 0 00-1 1z" clipRule="evenodd" />
                             </svg>
                           </div>
                           <div className="invisible group-hover:visible absolute z-50 w-64 mt-4 -left-1/2 transform -translate-x-1/2 transition-all duration-200 opacity-0 group-hover:opacity-100">
                             <div className="bg-white/95 backdrop-blur-sm border border-amber-200/60 rounded-lg shadow-lg overflow-hidden">
                               <div className="p-2.5">
                                 <div className="flex items-center mb-1">
                                   <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center mr-3">
                                     <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                       <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-3a1 1 0 001 1h.01a1 1 0 100-2H10a1 1 0 00-1 1z" clipRule="evenodd" />
                                     </svg>
                                   </div>
                                   <div>
                                     <div className="font-medium text-amber-800 text-sm">Forward Resolved ENS</div>
                                     <div className="text-amber-600 text-xs">Less secure - anyone could have pointed to this address</div>
                                   </div>
                                 </div>
                               </div>
                               <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white border border-amber-200/60 rotate-45"></div>
                             </div>
                           </div>
                         </div>
                       )}
                    </div>
                  )}
              </div>
              <div className="flex items-center">
              {(ensName && (ensResolution?.method === 'subgraph')) && (
                <div className="flex items-center">
                  <a 
                    href={getEnscribeUrl(fullAddress, getChainName().toLowerCase(), ensName, ensResolution?.method)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="group relative inline-flex items-center py-1.5 px-2 text-xs font-medium border border-blue-200 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden hover:px-3"
                  >
                    <svg width="14" height="14" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                      <rect width="32" height="32" rx="6" fill="currentColor" fillOpacity="0.15"/>
                      <path d="M10 12L6 16L10 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 12L26 16L22 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18 10L14 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="ml-0 group-hover:ml-2 max-w-0 group-hover:max-w-xs transition-all duration-300 overflow-hidden whitespace-nowrap">
                      Assign ENS via Enscribe
                    </span>
                    <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </a>
                </div>
              )}
              {!ensName && (
                <div className="flex items-center">
                  <a 
                    href={getEnscribeUrl(fullAddress, getChainName().toLowerCase(), ensName, ensResolution?.method)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="group relative inline-flex items-center py-1.5 px-2 text-xs font-medium border border-gray-200 rounded-lg text-gray-700 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden hover:px-3"
                  >
                    <svg width="14" height="14" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                      <rect width="32" height="32" rx="6" fill="currentColor" fillOpacity="0.15"/>
                      <path d="M10 12L6 16L10 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 12L26 16L22 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18 10L14 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="ml-0 group-hover:ml-2 max-w-0 group-hover:max-w-xs transition-all duration-300 overflow-hidden whitespace-nowrap">
                      Assign ENS via Enscribe
                    </span>
                    <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </a>
                </div>
              )}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(fullAddress);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="ml-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="Copy address"
              >
                {copied ? (
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                )}
              </button>
            </div>
            </div>
          </div>


          {/* Growthepie metrics */}
          {growthePieData && (
            <div className="mb-4">
              {isMultichain() && (
                <div className="text-xs text-gray-600 font-serif mb-2 text-center italic">
                  Aggregated data from {growthePieData.chains?.length} chains (7-day period)
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {growthePieData.txcount && (
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 relative group">
                    <div className="text-gray-700 text-xs uppercase font-serif mb-1">
                      Transaction Count {!isMultichain() ? '(7d)' : ''}
                    </div>
                    <div className="font-medium text-gray-900 flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                      </svg>
                      {formatNumber(growthePieData.txcount)}
                    </div>
                    
                    {/* Hover tooltip for transaction breakdown */}
                    {isMultichain() && growthePieData?.allChainData && (
                      <div className="absolute top-[120%] left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                        <div className="bg-white/80 backdrop-blur-md text-gray-800 text-xs rounded-lg p-3.5 shadow-lg min-w-48 border border-gray-100">
                          <div className="font-medium mb-2 text-center text-gray-700">Transaction Count Breakdown</div>
                          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                            {growthePieData.allChainData
                              .filter(chain => (chain.txcount || 0) > 0)
                              .map((chainData, index) => (
                                <div key={`${chainData.chain}-${index}`} className="flex justify-between items-center">
                                  <span className="text-gray-600 capitalize">
                                    {chainData.chain.replace('_', ' ')}
                                  </span>
                                  <span className="text-gray-900 font-medium">
                                    {formatNumber(chainData.txcount || 0)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {growthePieData.gas_fees_usd && (
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 relative group">
                    <div className="text-gray-700 text-xs uppercase font-serif mb-1">
                      Gas Fees {!isMultichain() ? '(7d)' : ''} (USD)
                    </div>
                    <div className="font-medium text-gray-900 flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      ${formatNumber(Math.round(growthePieData.gas_fees_usd))}
                    </div>
                    
                    {/* Hover tooltip for gas fees breakdown */}
                    {isMultichain() && growthePieData?.allChainData && (
                      <div className="absolute top-[120%] left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                        <div className="bg-white/80 backdrop-blur-md text-gray-800 text-xs rounded-lg p-3.5 shadow-lg min-w-48 border border-gray-100">
                          <div className="font-medium mb-2 text-center text-gray-700">Gas Fees Breakdown</div>
                          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                            {growthePieData.allChainData
                              .filter(chain => (chain.gas_fees_usd || 0) > 0)
                              .map((chainData, index) => (
                                <div key={`${chainData.chain}-${index}`} className="flex justify-between items-center">
                                  <span className="text-gray-600 capitalize">
                                    {chainData.chain.replace('_', ' ')}
                                  </span>
                                  <span className="text-gray-900 font-medium">
                                    ${formatNumber(Math.round(chainData.gas_fees_usd || 0))}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Attestations section */}
          {parsedAttestations.length > 0 && (
            <div className="border-l-2 border-gray-200 pl-3 py-1">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-gray-700 text-sm">Attestations ({parsedAttestations.length})</div>
                  {hasGrowthePieAttestation && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Validated by growthepie
                    </span>
                  )}
                  {shouldShowLabelStatus && labelsLoading && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      Loading labels...
                    </span>
                  )}
                  {shouldShowLabelStatus && !labelsLoading && labelsError && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
                      Labels unavailable
                    </span>
                  )}
                </div>
                {parsedAttestations.length > 1 && (
                  <button
                    onClick={() => setShowAllAttestations(!showAllAttestations)}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    {showAllAttestations ? 'Show less' : 'Show all'}
                  </button>
                )}
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(showAllAttestations ? parsedAttestations : parsedAttestations.slice(0, 2)).map((attestation, attestationIndex) => {
                  const isGrowthepieAttester = attestation.attester.toLowerCase() === GROWTHEPIE_ATTESTER.toLowerCase();
                  const attesterLabel = isGrowthepieAttester
                    ? 'labels.growthepie.eth'
                    : formatShortAddress(attestation.attester);
                  const isPlaceholder = attestation.txid.startsWith('search-');
                  const isMetadataLoading = attestationMetadataLoading[attestation.txid];

                  return (
                    <div
                      key={`${attestation.txid || attestation.timeCreated}-${attestationIndex}`}
                      className="bg-gray-50 rounded-md p-3 border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center gap-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 ${
                                isGrowthepieAttester ? '' : 'font-mono'
                              }`}
                              title={attestation.attester}
                            >
                              {attesterLabel}
                            </span>
                          </div>
                        {attestation.chainId && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {CHAINS.find(c => c.caip2 === attestation.chainId)?.name || attestation.chainId}
                          </span>
                        )}
                        {attestation.isOffchain && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                            Offchain
                          </span>
                        )}
                        {attestation.revoked && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                            Revoked
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTimestamp(attestation.timeCreated)}
                      </div>
                    </div>
                    
                    {/* Tags preview */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {isPlaceholder ? (() => {
                        const tag = attestation.tags[0];
                        if (!tag) {
                          return (
                            <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100">
                              <span className="text-xs text-gray-500">Includes selected tag.</span>
                            </div>
                          );
                        }

                        const keyParts = tag.name.split(':');
                        const key = keyParts[0].trim();
                        const value = tag.rawValue === true || tag.rawValue === false
                          ? String(tag.rawValue)
                          : tag.rawValue === null
                            ? 'null'
                            : String(tag.rawValue);

                        return (
                          <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100">
                            <span className="text-xs font-medium text-gray-500 mr-1">includes</span>
                            <span className="text-xs text-gray-700 mr-1">{key}:</span>
                            <span className="text-xs text-indigo-700">{value}</span>
                          </div>
                        );
                      })() : (
                        <>
                          {attestation.tags.slice(0, 3).map((tag, tagIndex) => {
                            const keyParts = tag.name.split(':');
                            const key = keyParts[0].trim();
                            const value = tag.rawValue === true || tag.rawValue === false 
                              ? String(tag.rawValue)
                              : tag.rawValue === null
                                ? 'null'
                                : String(tag.rawValue);
                                
                            return (
                              <div 
                                key={`${tag.id}-${tagIndex}`}
                                className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100"
                              >
                                <span className="text-xs font-medium text-gray-500 mr-1">{key}:</span>
                                <span className="text-xs text-indigo-700">{value}</span>
                              </div>
                            );
                          })}
                          {attestation.tags.length > 3 && (
                            <button
                              onClick={() => toggleAttestation(attestation.txid)}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-gray-100 text-gray-500 hover:bg-gray-200"
                            >
                              +{attestation.tags.length - 3} more
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Expanded tags */}
                    {!isPlaceholder && expandedAttestation === attestation.txid && attestation.tags.length > 3 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex flex-wrap gap-1">
                          {attestation.tags.slice(3).map((tag, tagIndex) => {
                            const keyParts = tag.name.split(':');
                            const key = keyParts[0].trim();
                            const value = tag.rawValue === true || tag.rawValue === false 
                              ? String(tag.rawValue)
                              : tag.rawValue === null
                                ? 'null'
                                : String(tag.rawValue);
                                
                            return (
                              <div 
                                key={`${tag.id}-${tagIndex}`}
                                className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100"
                              >
                                <span className="text-xs font-medium text-gray-500 mr-1">{key}:</span>
                                <span className="text-xs text-indigo-700">{value}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Action buttons */}
                    <div className="flex justify-end gap-2 mt-2">
                      {isPlaceholder && (
                        <button
                          onClick={() => loadAttestationMetadata(attestation)}
                          disabled={isMetadataLoading}
                          className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded-md border border-blue-100 hover:bg-blue-100 disabled:opacity-60"
                        >
                          {isMetadataLoading ? 'Loading...' : 'Load metadata'}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(attestation.raw, null, 2));
                        }}
                        className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-md border border-gray-200 hover:bg-gray-200"
                      >
                        Copy raw
                      </button>
                      {!isPlaceholder && attestation.tags.length > 3 && (
                        <button
                          onClick={() => toggleAttestation(attestation.txid)}
                          className="px-2 py-0.5 text-xs text-gray-600 hover:text-gray-800 flex items-center"
                        >
                          {expandedAttestation === attestation.txid ? (
                            <>
                              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                              Less
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              More
                            </>
                          )}
                        </button>
                      )}
                      {onSelectAttestation && (
                        <button
                          onClick={() => onSelectAttestation(attestation)}
                          className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100 hover:bg-indigo-100 flex items-center"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit/Confirm
                        </button>
                      )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Exact address matches on other chains */}
          {growthePieData?.allChainData && (() => {
            // Filter to only show unlabeled chains
            const unlabeledChains = growthePieData.allChainData.filter(chainData => {
              const chainId = chainData.chain_id;
              return chainId ? !parsedAttestations.some(att => att.chainId === chainId) : true;
            });

            if (unlabeledChains.length === 0) return null;

            return (
              <div className="mt-4">
                <div 
                  className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => setShowChainMatches(!showChainMatches)}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <div>
                      <div className="text-sm font-medium text-blue-800">
                        Unlabeled address matches found on {unlabeledChains.length} other chain{unlabeledChains.length !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-blue-600">
                        Click to view details and create labels
                      </div>
                    </div>
                  </div>
                  <svg 
                    className={`w-4 h-4 text-blue-600 transition-transform ${showChainMatches ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {showChainMatches && (
                  <div className="mt-3 space-y-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-gray-700">
                        Would you like to instantly label these addresses?
                      </div>
                      <a
                        href={(() => {
                          const params = new URLSearchParams({
                            address: fullAddress,
                            bulk: 'true',
                            chains: unlabeledChains.map(c => c.chain).join(',')
                          });
                          
                          const mostRecentAttestation = parsedAttestations
                            .sort((a, b) => b.timeCreated - a.timeCreated)[0];
                          
                          if (mostRecentAttestation?.tags) {
                            mostRecentAttestation.tags.forEach(tag => {
                              const [key, value] = tag.name.split(':').map(s => s.trim());
                              if (key && value && key !== 'chain_id') {
                                params.set(`tag_${key}`, value);
                              }
                            });
                          }
                          
                          return `/attest?${params.toString()}`;
                        })()}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Label All Chains
                      </a>
                    </div>

                              <div className="space-y-3">
            {unlabeledChains.map((chainData, index) => {
              const chainName = chainData.chain;
              const colors = getChainColors(chainName);
              
              return (
                <div 
                  key={`${chainName}-${index}`}
                  className="group relative rounded-lg p-4 transition-all duration-200 hover:shadow-md"
                  style={{
                    background: colors.background,
                    borderLeft: `4px solid ${colors.accent}`,
                    border: `1px solid ${colors.border}`
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span 
                          className="font-semibold text-sm capitalize"
                          style={{ color: colors.text }}
                        >
                          {chainName.replace('_', ' ')}
                        </span>
                        {chainData.name && (
                          <span className="text-gray-500 text-xs">({chainData.name})</span>
                        )}
                      </div>
                      {chainData.usage_category && (
                        <span 
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ 
                            backgroundColor: `${colors.accent}15`,
                            color: colors.accent 
                          }}
                        >
                          {chainData.usage_category}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6">
                      {(chainData.txcount || 0) > 0 && (
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1">
                            <svg 
                              className="w-3.5 h-3.5" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                              style={{ color: colors.accent }}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span className="font-bold text-sm text-gray-800">
                              {formatNumber(chainData.txcount || 0)}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 font-medium">transactions</span>
                        </div>
                      )}
                      {(chainData.gas_fees_usd || 0) > 0 && (
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1">
                            <svg 
                              className="w-3.5 h-3.5" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                              style={{ color: colors.accent }}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-bold text-sm text-gray-800">
                              ${formatNumber(Math.round(chainData.gas_fees_usd || 0))}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 font-medium">gas fees</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Actions area */}
        <div className="mt-5 pt-3 border-t border-dashed border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="text-gray-500 font-serif text-xs italic">
                {attestations.length} attestation{attestations.length !== 1 ? 's' : ''} found for this address
              </div>
              <a 
                href={getEasScanUrl()} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200 text-xs flex items-center transition-colors"
                title="View on EAS Scan for detailed attestation analysis"
              >
                <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 6H6C4.89543 6 4 6.89543 4 8V18C4 19.1046 4.89543 20 6 20H16C17.1046 20 18 19.1046 18 18V14M14 4H20M20 4V10M20 4L10 14" />
                </svg>
                EAS Scan
              </a>
            </div>
            
            {onAttest && (
              <button
                onClick={onAttest}
                className="relative group overflow-hidden bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-white px-4 py-1.5 rounded-xl text-sm font-serif flex items-center transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <span className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></span>
                <svg className="w-3.5 h-3.5 mr-1.5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="relative z-10">Add Attestation</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default SearchContractCard;
