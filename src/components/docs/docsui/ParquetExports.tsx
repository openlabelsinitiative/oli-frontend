import React from 'react';
import UrlDisplay from './UrlDisplay';

interface ParquetExportsProps {
  className?: string;
}

const ParquetExports: React.FC<ParquetExportsProps> = ({ className = "" }) => {
  return (
    <div className={className}>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Parquet Exports</h2>
      
      <p className="text-gray-600 mb-6">
        Parquet exports of all labels in the OLI Label Pool are provided by growthepie at the following links:
      </p>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Raw:</h3>
          <UrlDisplay 
            url="https://api.growthepie.com/v1/oli/labels_raw.parquet"
            className="mb-4"
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Decoded:</h3>
          <UrlDisplay 
            url="https://api.growthepie.com/v1/oli/labels_decoded.parquet"
          />
        </div>
      </div>
    </div>
  );
};

export default ParquetExports;
