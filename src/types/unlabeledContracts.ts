// types/unlabeledContracts.ts

// Chain keys matching the API endpoints
export type ChainKey = 
  | 'arbitrum' 
  | 'polygon_zkevm' 
  | 'optimism' 
  | 'zksync_era' 
  | 'base' 
  | 'zora' 
  | 'linea' 
  | 'scroll' 
  | 'mantle' 
  | 'mode' 
  | 'taiko' 
  | 'swell'
  | 'megaeth'
  | 'polygon_pos';

// Represents a contract from the API
export interface Contract {
  address: string;
  txCount: number;
  gasFeesEth: number;
}

// Represents an unlabeled contract with chain and timeframe information
export interface UnlabeledContract {
  chain: ChainKey;
  address: string;
  txCount: number;
  gasFeesEth: number;
  timeRange: string;
  dayRange: number;
}

// Interface for the ChainData received from the API
export interface ChainData {
  overview: {
    types: string[];
    [timeRange: string]: {
      unlabeled?: {
        data: number[];
        contracts?: {
          types: string[];
          data: any[][];
        }
      }
    } & Record<string, any>;
  }
}

// For the attestation form
export interface AttestationFormValues {
  address: string;
  ownerProject: string;
  tags: {
    id: string;
    name: string;
  }[];
  labelerNotes: string;
  attesterAddress: string;
} 