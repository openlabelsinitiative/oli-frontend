'use client';

import React, { useEffect, useState } from 'react';
import { Attestation, fetchLatestAttestations } from '@/services/attestationService';
import { CHAINS } from '@/constants/chains';

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

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatValue = (value: unknown): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return value.map(item => String(item)).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string') {
    return value.length > 40 ? `${value.slice(0, 40)}...` : value;
  }
  return String(value);
};

const getTagEntries = (attestation: Attestation): Array<[string, unknown]> => {
  const tagsJson = attestation.tags_json as Record<string, unknown> | null | undefined;
  if (tagsJson && typeof tagsJson === 'object' && !Array.isArray(tagsJson)) {
    return Object.entries(tagsJson);
  }

  return Object.entries(attestation).filter(([key]) => !BASE_FIELDS.has(key));
};

const LatestAttestations: React.FC = () => {
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAttestations = async () => {
      try {
        const data = await fetchLatestAttestations(5);
        setAttestations(data);
      } catch (err) {
        console.error('Error fetching latest attestations', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch attestations');
      } finally {
        setLoading(false);
      }
    };

    loadAttestations();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading latest attestations...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">Error: {error}</div>;
  }

  return (
    <div className="mt-12 p-8 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.05)]">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest Attestations</h2>

      <div className="space-y-4">
        {attestations.map((attestation, index) => {
          const tagEntries = getTagEntries(attestation);
          const chain = attestation.chain_id
            ? CHAINS.find(c => c.caip2 === attestation.chain_id)
            : null;
          const chainLabel = chain?.shortName || (attestation.chain_id ? `Chain ${attestation.chain_id.split(':').pop()}` : null);

          return (
            <div
              key={`${attestation.timeCreated}-${index}`}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
              onClick={() => {
                if (attestation.isOffchain) {
                  window.open(`https://ipfs.io/ipfs/${attestation.ipfsHash}`, '_blank');
                } else {
                  window.open(`https://base.easscan.org/attestation/view/${attestation.id}`, '_blank');
                }
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center px-3 py-1 bg-gray-100 rounded-md border border-gray-200">
                    <span className="text-sm font-medium text-gray-500 mr-2">To:</span>
                    <code className="text-sm font-mono text-gray-500">
                      {attestation.recipient.substring(0, 6)}...
                      {attestation.recipient.substring(attestation.recipient.length - 4)}
                    </code>
                  </div>

                  {chainLabel && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                      {chainLabel}
                    </span>
                  )}

                  {attestation.isOffchain && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-600 rounded-full border border-purple-100">
                      Offchain
                    </span>
                  )}
                </div>

                <div className="text-sm text-gray-400">
                  {formatTimestamp(Number(attestation.timeCreated))}
                </div>
              </div>

              {tagEntries.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tagEntries.map(([key, value]) => (
                    <div
                      key={key}
                      className="inline-flex items-center px-2 py-1 rounded-md bg-gray-50 border border-gray-200"
                    >
                      <span className="text-xs text-gray-400 mr-1.5">{key}:</span>
                      <span className="text-xs font-medium text-gray-700">
                        {formatValue(value)}
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
  );
};

export default LatestAttestations;
