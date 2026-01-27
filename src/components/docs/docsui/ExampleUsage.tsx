import React from 'react';
import CodeBlock from './CodeBlock';
import UrlDisplay from './UrlDisplay';
import ParquetExports from './ParquetExports';
import CodeExamples from './CodeExamples';

const ExampleUsage: React.FC = () => {
  const codeExamples = [
    {
      language: 'javascript',
      title: 'JavaScript Example',
      code: `// Example of using the OLI API
const response = await fetch('https://api.growthepie.com/v1/oli/labels_raw.parquet');
const data = await response.arrayBuffer();
console.log('Parquet data loaded:', data);`
    },
    {
      language: 'python',
      title: 'Python Example', 
      code: `# Example of using the OLI API with Python
import pandas as pd

# Load parquet data
df = pd.read_parquet('https://api.growthepie.com/v1/oli/labels_raw.parquet')
print(f"Loaded {len(df)} labels")`
    },
    {
      language: 'bash',
      title: 'cURL Example',
      code: `# Download the parquet file
curl -o labels_raw.parquet https://api.growthepie.com/v1/oli/labels_raw.parquet

# Check file size
ls -lh labels_raw.parquet`
    }
  ];

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold">UI Component Examples</h1>
      
      {/* Simple code block without header */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Simple Code Block</h2>
        <CodeBlock>
          https://api.growthepie.com/v1/oli/labels_raw.parquet
        </CodeBlock>
      </div>

      {/* Code block with language */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Code Block with Language</h2>
        <CodeBlock language="json" title="Sample Response">
{`{
  "address": "0x1234567890abcdef",
  "chain_id": "eip155:1",
  "tag_id": "contract_name",
  "value": "Uniswap V3 Pool"
}`}
        </CodeBlock>
      </div>

      {/* URL Display */}
      <div>
        <h2 className="text-lg font-semibold mb-4">URL Display</h2>
        <UrlDisplay 
          url="https://api.growthepie.com/v1/oli/labels_raw.parquet"
          label="Raw Parquet Export"
        />
      </div>

      {/* Parquet Exports Component */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Parquet Exports</h2>
        <ParquetExports />
      </div>

      {/* Code Examples with Tabs */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Code Examples with Tabs</h2>
        <CodeExamples 
          examples={codeExamples}
          defaultLanguage="javascript"
        />
      </div>
    </div>
  );
};

export default ExampleUsage;
