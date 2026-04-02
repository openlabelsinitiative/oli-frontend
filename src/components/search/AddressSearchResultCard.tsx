'use client';

import React, { useState } from 'react';
import { CHAINS } from '@/constants/chains';
import type { AddressSearchResult, LabelItem } from '@/services/addressSearchService';
import { fetchLabelsForAddress } from '@/services/addressSearchService';

interface AddressSearchResultCardProps {
  result: AddressSearchResult;
  chainFilter?: string;
}

const formatShortAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const AddressSearchResultCard: React.FC<AddressSearchResultCardProps> = ({ result, chainFilter }) => {
  const [expanded, setExpanded] = useState(false);
  const [labels, setLabels] = useState<LabelItem[]>([]);
  const [labelsLoading, setLabelsLoading] = useState(false);
  const [labelsError, setLabelsError] = useState('');

  const chainMetadata = CHAINS.find(chain => chain.caip2 === result.chain_id);
  const chainLabel = chainMetadata?.name || result.chain_id;

  const handleToggle = async () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);

    if (!nextExpanded || labelsLoading || labels.length > 0) {
      return;
    }

    setLabelsLoading(true);
    setLabelsError('');
    try {
      const response = await fetchLabelsForAddress({
        address: result.address,
        chainId: chainFilter || undefined
      });
      setLabels(response.labels);
    } catch (error) {
      setLabelsError(error instanceof Error ? error.message : 'Failed to load labels');
    } finally {
      setLabelsLoading(false);
    }
  };

  const handleAttest = () => {
    const attestUrl = new URL('/attest', window.location.origin);
    attestUrl.searchParams.set('address', result.address);
    const chainId = chainFilter || result.chain_id;
    if (chainId) {
      attestUrl.searchParams.set('chain', chainId);
    }
    window.open(attestUrl.toString(), '_blank');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.05)]">
      <div className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm text-gray-900">{result.address}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                {chainLabel}
              </span>
            </div>
            <div className="text-xs text-gray-500 flex flex-wrap gap-3">
              <span>Attester: {result.attester ? formatShortAddress(result.attester) : 'Unknown'}</span>
              <span>Last seen: {formatTimestamp(result.time)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggle}
              className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md hover:bg-indigo-100"
            >
              {expanded ? 'Hide labels' : 'View labels'}
            </button>
            <button
              onClick={handleAttest}
              className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-md hover:opacity-90"
            >
              Add Attestation
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            {labelsLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-indigo-500 animate-spin"></div>
                Loading labels...
              </div>
            )}

            {labelsError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                {labelsError}
              </div>
            )}

            {!labelsLoading && !labelsError && (
              <div className="space-y-3">
                {labels.length === 0 ? (
                  <div className="text-sm text-gray-500">No labels found for this address.</div>
                ) : (
                  labels.map(label => (
                    <div
                      key={`${label.tag_id}-${label.tag_value}-${label.time}`}
                      className="flex flex-col gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-medium text-gray-700">{label.tag_id}</span>
                        <span className="text-indigo-700 font-semibold">{label.tag_value}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {CHAINS.find(chain => chain.caip2 === label.chain_id)?.shortName || label.chain_id}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 flex flex-wrap gap-3">
                        <span>Attester: {label.attester ? formatShortAddress(label.attester) : 'Unknown'}</span>
                        <span>{formatTimestamp(label.time)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressSearchResultCard;
