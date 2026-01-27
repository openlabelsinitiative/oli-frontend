'use client';

import React, { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LoadingAnimation from '@/components/LoadingAnimation';
import CustomDropdown from '@/components/attestation/CustomDropdown';
import OwnerProjectSelect from '@/components/attestation/OwnerProjectSelect';
import UsageCategorySelect from '@/components/attestation/UsageCategorySelect';
import SearchContractCard from '@/components/SearchContractCard';
import { CHAINS, CHAIN_OPTIONS } from '@/constants/chains';
import { TAG_DESCRIPTIONS } from '@/constants/tagDescriptions';
import { formFields } from '@/constants/formFields';
import { validateAddressForChain } from '@/utils/validation';
import { parseCaip10 } from '@/utils/caipUtils';
import { searchAttestations, type Attestation } from '@/services/attestationService';
import type { AddressSearchResult } from '@/services/addressSearchService';
import { searchAddressesByTag } from '@/services/addressSearchService';

type SearchFilters = {
  tagId: string;
  tagValue?: string;
  chainId?: string;
  limit: number;
};

const BASE_TAG_OPTIONS = formFields
  .filter(field => field.id !== 'chain_id' && field.id !== 'address')
  .map(field => {
    const description = TAG_DESCRIPTIONS[field.tooltipKey as keyof typeof TAG_DESCRIPTIONS];
    const group = field.id.startsWith('_')
      ? 'Metadata'
      : field.visibility === 'advanced'
        ? 'Advanced tags'
        : 'Core tags';
    return {
      value: field.id,
      label: field.label,
      description,
      group
    };
  });

const buildTagOptions = (activeTagId: string) => {
  if (!activeTagId || BASE_TAG_OPTIONS.some(option => option.value === activeTagId)) {
    return BASE_TAG_OPTIONS;
  }
  return [
    ...BASE_TAG_OPTIONS,
    {
      value: activeTagId,
      label: activeTagId,
      group: 'Custom tags'
    }
  ];
};

const normalizeChain = (chainParam: string): string | null => {
  if (!chainParam) return null;

  const param = chainParam.toLowerCase().trim();

  const numericChainId = parseInt(param);
  if (!isNaN(numericChainId)) {
    const chain = CHAINS.find(c => c.id === numericChainId.toString());
    return chain ? chain.caip2 : null;
  }

  if (param.startsWith('eip155:')) {
    const chainId = param.split(':')[1];
    const chain = CHAINS.find(c => c.id === chainId);
    return chain ? chain.caip2 : null;
  }

  const normalizedParam = param.replace(/[\s_-]/g, '').toLowerCase();
  const directMatch = CHAINS.find(c => {
    const chainName = c.name.replace(/[\s_-]/g, '').toLowerCase();
    const chainShortName = c.shortName.replace(/[\s_-]/g, '').toLowerCase();
    const chainId = c.id.replace(/[\s_-]/g, '').toLowerCase();

    return chainName === normalizedParam ||
           chainShortName === normalizedParam ||
           chainId === normalizedParam;
  });

  if (directMatch) return directMatch.caip2;

  const aliasMap: Record<string, string> = {
    eth: 'eip155:1',
    mainnet: 'eip155:1',
    ethereum: 'eip155:1',
    arbitrum: 'eip155:42161',
    arb: 'eip155:42161',
    optimism: 'eip155:10',
    op: 'eip155:10',
    base: 'eip155:8453',
    polygon: 'eip155:137',
    matic: 'eip155:137',
    avalanche: 'eip155:43114',
    avax: 'eip155:43114'
  };

  return aliasMap[normalizedParam] || null;
};

const getAddressValidationError = (address: string, chainId?: string): string | null => {
  return validateAddressForChain(address, chainId);
};

const clampLimit = (value: number): number => {
  if (!Number.isFinite(value)) return 10;
  return Math.min(Math.max(value, 1), 100);
};

const buildSearchAttestation = (
  result: AddressSearchResult,
  filters: SearchFilters | null
): Attestation => {
  const parsedTime = Date.parse(result.time);
  const timeCreated = Number.isFinite(parsedTime)
    ? Math.floor(parsedTime / 1000)
    : Math.floor(Date.now() / 1000);
  const tagsJson = filters?.tagId
    ? { [filters.tagId]: filters.tagValue ?? '(any)' }
    : null;

  return {
    attester: result.attester ?? '0x0000000000000000000000000000000000000000',
    timeCreated,
    txid: `search-${result.address}-${result.chain_id}-${result.time}-${result.attester ?? 'unknown'}`,
    isOffchain: false,
    revoked: false,
    chain_id: result.chain_id,
    tags_json: tagsJson,
    recipient: result.address
  } as Attestation;
};


function SearchContent() {
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString() ?? '';

  const [searchMode, setSearchMode] = useState<'tag' | 'address'>('tag');
  const [tagId, setTagId] = useState('owner_project');
  const [tagValue, setTagValue] = useState('');
  const [selectedChain, setSelectedChain] = useState('');
  const [limit, setLimit] = useState(10);
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [resultCount, setResultCount] = useState(0);
  const [addressQuery, setAddressQuery] = useState('');
  const [addressAttestations, setAddressAttestations] = useState<Attestation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters | null>(null);
  const [appliedAddress, setAppliedAddress] = useState<{ address: string; chainId?: string; limit: number } | null>(null);

  const tagOptions = useMemo(() => buildTagOptions(tagId), [tagId]);
  const selectedTagField = useMemo(
    () => formFields.find(field => field.id === tagId),
    [tagId]
  );

  const groupedResults = useMemo(() => {
    const grouped = new Map<string, { address: string; attestations: Attestation[] }>();

    results.forEach(result => {
      const key = result.address.toLowerCase();
      const entry = grouped.get(key) ?? { address: result.address, attestations: [] };
      const attestation = buildSearchAttestation(result, appliedFilters);

      if (!entry.attestations.some(existing => existing.txid === attestation.txid)) {
        entry.attestations.push(attestation);
      }

      grouped.set(key, entry);
    });

    const groups = Array.from(grouped.values());

    groups.forEach(group => {
      group.attestations.sort((a, b) => Number(b.timeCreated) - Number(a.timeCreated));
    });

    return groups.sort((a, b) => {
      const latestA = Math.max(...a.attestations.map(att => Number(att.timeCreated) || 0));
      const latestB = Math.max(...b.attestations.map(att => Number(att.timeCreated) || 0));
      return latestB - latestA;
    });
  }, [results, appliedFilters]);


  const executeSearch = useCallback(async (filters: SearchFilters) => {
    if (!filters.tagId) {
      setError('Select a tag to search by');
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setError('');
    setResults([]);
    setResultCount(0);
    setAppliedFilters(filters);
    setAppliedAddress(null);
    setAddressAttestations([]);

    try {
      const response = await searchAddressesByTag({
        tagId: filters.tagId,
        tagValue: filters.tagValue,
        chainId: filters.chainId,
        limit: filters.limit
      });

      setResults(response.results || []);
      setResultCount(response.count || response.results?.length || 0);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred while searching');
      setResults([]);
      setResultCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const executeAddressSearch = useCallback(async (address: string, chainId?: string, requestedLimit?: number) => {
    const trimmedAddress = address.trim();
    const parsedCaip10 = parseCaip10(trimmedAddress);
    const resolvedAddress = parsedCaip10 ? parsedCaip10.address : trimmedAddress;
    const resolvedChainId = chainId || (parsedCaip10?.isKnownChain ? parsedCaip10.chainId : undefined);

    if (!resolvedAddress) {
      setError('Please enter an address');
      return;
    }

    const validationError = getAddressValidationError(resolvedAddress, resolvedChainId);
    if (validationError) {
      setError(validationError);
      return;
    }

    const effectiveLimit = clampLimit(requestedLimit ?? 10);

    setIsLoading(true);
    setHasSearched(true);
    setError('');
    setAddressAttestations([]);
    setResults([]);
    setResultCount(0);
    setAppliedFilters(null);
    setAppliedAddress({ address: resolvedAddress, chainId: resolvedChainId || undefined, limit: effectiveLimit });

    try {
      const attestations = await searchAttestations({
        recipient: resolvedAddress,
        chainId: resolvedChainId || undefined,
        limit: effectiveLimit
      });
      setAddressAttestations(attestations);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred while fetching attestations');
      setAddressAttestations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(searchParamsString);
    const addressParam = params.get('address') || params.get('contract');
    const tagIdParam = params.get('tag_id');
    const chainParam = params.get('chain') || params.get('chainId') || params.get('chain_id');
    const limitParam = params.get('limit');
    const normalizedChain = chainParam ? normalizeChain(chainParam) : null;
    const parsedLimit = limitParam ? Number(limitParam) : 10;
    const safeLimit = clampLimit(parsedLimit);

    if (normalizedChain) {
      setSelectedChain(normalizedChain);
    } else if (chainParam) {
      console.warn(`Invalid chain parameter: ${chainParam}`);
    }

    setLimit(safeLimit);

    const parsedAddressParam = addressParam ? parseCaip10(addressParam.trim()) : null;

    if (parsedAddressParam?.isKnownChain && !normalizedChain) {
      setSelectedChain(parsedAddressParam.chainId);
    }

    if (addressParam) {
      setSearchMode('address');
      const trimmedAddress = addressParam.trim();
      const resolvedAddress = parsedAddressParam ? parsedAddressParam.address : trimmedAddress;
      const resolvedChainId = normalizedChain || (parsedAddressParam?.isKnownChain ? parsedAddressParam.chainId : undefined);
      setAddressQuery(resolvedAddress);
      executeAddressSearch(trimmedAddress, resolvedChainId, safeLimit);
      return;
    }

    if (!tagIdParam) {
      return;
    }

    const tagValueParam = params.get('tag_value') || '';
    setSearchMode('tag');
    setTagId(tagIdParam);
    setTagValue(tagValueParam);

    executeSearch({
      tagId: tagIdParam,
      tagValue: tagValueParam.trim() || undefined,
      chainId: normalizedChain || undefined,
      limit: safeLimit
    });
  }, [searchParamsString, executeSearch, executeAddressSearch]);

  const handleSearch = () => {
    if (searchMode === 'address') {
      executeAddressSearch(addressQuery, selectedChain || undefined, limit);
      return;
    }

    executeSearch({
      tagId: tagId.trim(),
      tagValue: tagValue.trim() || undefined,
      chainId: selectedChain || undefined,
      limit
    });
  };

  const handleSearchModeChange = (mode: 'tag' | 'address') => {
    if (mode === searchMode) return;
    setSearchMode(mode);
    setError('');
    setHasSearched(false);
    setResults([]);
    setResultCount(0);
    setAddressAttestations([]);
    setAppliedFilters(null);
    setAppliedAddress(null);
  };

  const handleAddressChange = (value: string) => {
    const parsedCaip10 = parseCaip10(value);
    if (parsedCaip10?.isKnownChain) {
      setSelectedChain(parsedCaip10.chainId);
      setAddressQuery(parsedCaip10.address);
    } else {
      setAddressQuery(value);
    }
    setError('');
  };

  const handleTagIdChange = (value: string) => {
    setTagId(value);
    setTagValue('');
    setError('');
  };

  const handleTagValueChange = (value: string) => {
    setTagValue(value);
    setError('');
  };

  const handleChainChange = (value: string) => {
    setSelectedChain(value);
    setError('');
  };

  const handleAttest = useCallback((targetAddress: string, chainId?: string) => {
    const attestUrl = new URL('/attest', window.location.origin);
    attestUrl.searchParams.set('address', targetAddress);
    if (chainId) {
      attestUrl.searchParams.set('chain', chainId);
    }
    window.open(attestUrl.toString(), '_blank');
  }, []);

  const renderTagValueInput = () => {
    if (tagId === 'owner_project') {
      return (
        <OwnerProjectSelect value={tagValue} onChange={handleTagValueChange} />
      );
    }

    if (tagId === 'usage_category') {
      return (
        <UsageCategorySelect value={tagValue} onChange={handleTagValueChange} />
      );
    }

    if (selectedTagField?.type === 'multiselect') {
      return (
        <input
          type="text"
          value={tagValue}
          onChange={(event) => handleTagValueChange(event.target.value)}
          placeholder="Comma-separated values (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      );
    }

    if (selectedTagField?.options?.length) {
      const tagValueOptions = selectedTagField.options.map(option => ({
        value: String(option.value),
        label: option.label
      }));

      return (
        <CustomDropdown
          id="tag_value"
          options={tagValueOptions}
          value={tagValue}
          onChange={handleTagValueChange}
          placeholder="Select a value (optional)"
          showGroups={false}
        />
      );
    }

    return (
      <input
        type="text"
        value={tagValue}
        onChange={(event) => handleTagValueChange(event.target.value)}
        placeholder="Enter a value (optional)"
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    );
  };

  const appliedChainLabel = appliedFilters?.chainId
    ? CHAINS.find(chain => chain.caip2 === appliedFilters.chainId)?.name || appliedFilters.chainId
    : 'All chains';

  const appliedAddressChainLabel = appliedAddress?.chainId
    ? CHAINS.find(chain => chain.caip2 === appliedAddress.chainId)?.name || appliedAddress.chainId
    : 'All chains';

  const activeChainLabel = selectedChain
    ? CHAINS.find(chain => chain.caip2 === selectedChain)?.name || selectedChain
    : 'all chains';

  const outputSummary = searchMode === 'address'
    ? `Will return attestations for ${addressQuery ? addressQuery.trim() : 'the address'} on ${activeChainLabel} (up to ${limit}), with label tags merged under each attester, from the OLI label pool.`
    : `Will return addresses with ${tagId}${tagValue ? ` = ${tagValue}` : ''} on ${activeChainLabel} (up to ${limit}) from the OLI label pool.`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.05)]">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2 text-gray-900">Search Address Labels</h1>
            <p className="text-sm text-gray-500">
              Search addresses by project, usage category, any tag, or a specific address. Use the chain filter to narrow results.
            </p>
            <p className="mt-2 text-sm text-indigo-600">
              {outputSummary}
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => handleSearchModeChange('tag')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  searchMode === 'tag'
                    ? 'bg-white text-indigo-700 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Tag search
              </button>
              <button
                type="button"
                onClick={() => handleSearchModeChange('address')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  searchMode === 'address'
                    ? 'bg-white text-indigo-700 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Address search
              </button>
            </div>
            <div className="text-xs text-gray-500">
              {searchMode === 'address'
                ? 'Paste an address to see attestations and labels.'
                : 'Tip: Use the project dropdown for fast owner_project searches.'}
            </div>
          </div>

          {searchMode === 'tag' ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Tag</label>
                <div className="mt-2">
                  <CustomDropdown
                    id="tag_id"
                    options={tagOptions}
                    value={tagId}
                    onChange={handleTagIdChange}
                    placeholder="Select a tag"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {selectedTagField?.label || 'Value'} <span className="text-gray-400">(optional)</span>
                </label>
                <div className="mt-2">
                  {renderTagValueInput()}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Chain filter</label>
                <div className="mt-2">
                  <CustomDropdown
                    id="chain_filter"
                    options={CHAIN_OPTIONS}
                    value={selectedChain}
                    onChange={handleChainChange}
                    placeholder="All chains"
                    showGroups={true}
                    isChainDropdown={true}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Limit</label>
                <div className="mt-2">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={limit}
                  onChange={(event) => setLimit(clampLimit(Number(event.target.value)))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <label className="text-sm font-medium text-gray-700">Address</label>
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Enter address (CAIP-10 or chain-specific)"
                    value={addressQuery}
                    onChange={(event) => handleAddressChange(event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Chain filter</label>
                <div className="mt-2">
                  <CustomDropdown
                    id="chain_filter"
                    options={CHAIN_OPTIONS}
                    value={selectedChain}
                    onChange={handleChainChange}
                    placeholder="All chains"
                    showGroups={true}
                    isChainDropdown={true}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Attestation limit</label>
                <div className="mt-2">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={limit}
                  onChange={(event) => setLimit(clampLimit(Number(event.target.value)))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-xs text-gray-500">
              {searchMode === 'address'
                ? 'Searching by address pulls attestations and lets you expand labels.'
                : 'Tip: Use the project dropdown for fast owner_project searches.'}
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>

        {isLoading && <LoadingAnimation />}

        {!isLoading && hasSearched && (
          <>
            {searchMode === 'tag' ? (
              groupedResults.length > 0 ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Addresses Found</h2>
                    <p className="text-gray-600">
                      Showing {groupedResults.length} address{groupedResults.length !== 1 ? 'es' : ''} from {resultCount} attestations matched on {appliedChainLabel} for
                      <span className="font-medium text-gray-700"> {appliedFilters?.tagId}</span>
                      {appliedFilters?.tagValue ? ` = ${appliedFilters.tagValue}` : ''}.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {groupedResults.map(group => {
                      const chainId = appliedFilters?.chainId || group.attestations[0]?.chain_id;

                      return (
                        <SearchContractCard
                          key={group.address.toLowerCase()}
                          address={group.address}
                          attestations={group.attestations}
                          onAttest={() => handleAttest(group.address, chainId)}
                          enableLabelsLookup={true}
                          labelChainFilter={appliedFilters?.chainId}
                          groupLabelsByAttester={true}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-yellow-800 mb-2">No Addresses Found</h3>
                    <p className="text-yellow-700">
                      Try adjusting your tag value, chain filter, or limit.
                    </p>
                  </div>
                </div>
              )
            ) : (
              addressAttestations.length > 0 ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Address Found</h2>
                    <p className="text-gray-600">
                      {addressAttestations.length} attestation{addressAttestations.length !== 1 ? 's' : ''} found for
                      <span className="font-medium text-gray-700"> {appliedAddress?.address}</span>
                      {appliedAddress?.chainId ? ` on ${appliedAddressChainLabel}` : ''}.
                    </p>
                  </div>

                  <SearchContractCard
                    address={appliedAddress?.address || addressQuery}
                    attestations={addressAttestations}
                    onAttest={() => handleAttest(appliedAddress?.address || addressQuery, appliedAddress?.chainId)}
                    enableLabelsLookup={true}
                    labelChainFilter={appliedAddress?.chainId}
                    groupLabelsByAttester={true}
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-yellow-800 mb-2">No Attestations Found</h3>
                    <p className="text-yellow-700 mb-4">
                      This address doesn&apos;t have any attestations yet. Be the first to contribute!
                    </p>
                    <button
                      onClick={() => handleAttest(appliedAddress?.address || addressQuery, appliedAddress?.chainId)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      Create First Attestation
                    </button>
                  </div>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingAnimation />}>
      <SearchContent />
    </Suspense>
  );
}
