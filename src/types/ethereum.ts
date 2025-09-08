// types/ethereum.ts
export interface RequestArguments {
    method: string;
    params?: unknown[];
  }
  
  // Note: Window.ethereum type is already declared by @dynamic-labs/ethereum
  // We just export RequestArguments for compatibility