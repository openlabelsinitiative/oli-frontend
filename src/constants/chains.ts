// src/constants/chains.ts

interface ChainColors {
  light: [string, string];
  dark: [string, string];
  darkTextOnBackground: boolean;
}

interface ChainLogo {
  body: string;
  width: number;
  height?: number;
}

export interface ChainMetadata {
  id: string;
  name: string;
  caip2: string;
  colors: ChainColors;
  logo: ChainLogo | null;
  shortName: string;
  description: string;
  chainId?: number;
  isTestnet?: boolean;
  isOrbitChain?: boolean;
  orbitMetadata?: {
    parentChain: string;
    deployerTeam: string | null;
    status: string;
    layer: number | null;
    category: string;
  };
}

// Base chains that are always available
const BASE_CHAINS: ChainMetadata[] = [
  {
    id: 'arbitrum',
    name: 'Arbitrum One',
    shortName: 'Arbitrum',
    caip2: 'eip155:42161',
    isOrbitChain: false,
    orbitMetadata: {
      parentChain: 'Ethereum',
      deployerTeam: 'Offchain Labs',
      status: 'Mainnet',
      layer: 2,
      category: 'universal'
    },
    colors: {
      light: ['#2ECEE8', '#2ECEE8'],
      dark: ['#1DF7EF', '#1DF7EF'],
      darkTextOnBackground: true
    },
    logo: {
      body: '<path fill-rule="evenodd" clip-rule="evenodd" d="M6.49882 0.25C6.31305 0.25 6.12598 0.298774 5.95898 0.397507L0.728432 3.47222C0.394175 3.6685 0.188599 4.03154 0.188599 4.4241V10.5747C0.188599 10.9674 0.394305 11.3303 0.728432 11.5266L1.66702 12.0784L4.50997 4.14223C4.54389 4.04693 4.6327 3.98392 4.73199 3.98392H6.05827C6.14125 3.98392 6.1986 4.06723 6.16935 4.14579L3.03893 12.885L5.96015 14.6025C6.12728 14.7 6.31305 14.75 6.49998 14.75C6.68692 14.75 6.87282 14.7012 7.03981 14.6025L12.2715 11.5266C12.6058 11.3303 12.8114 10.9673 12.8114 10.5747V4.4241C12.8114 4.03141 12.6057 3.6685 12.2715 3.47222L7.03865 0.397507C6.87152 0.298774 6.68459 0.25 6.49882 0.25ZM8.71446 5.36421C8.75187 5.25836 8.89906 5.25836 8.93647 5.36421L11.0654 11.2629L9.69353 12.0696L8.02497 7.45488C8.00633 7.40136 8.00633 7.34297 8.02497 7.28945L8.71446 5.36421ZM6.86452 10.5272L7.55401 8.60199C7.59142 8.49613 7.73848 8.49613 7.7759 8.60199L9.14775 12.3897L7.7759 13.1964L6.86452 10.6927C6.84588 10.6391 6.84588 10.5807 6.86452 10.5272ZM7.05276 3.98392H8.37903C8.46085 3.98392 8.5182 4.06723 8.49011 4.14579L4.95634 14.0114L3.58449 13.2046L6.83074 4.14223C6.86465 4.04693 6.95346 3.98392 7.05276 3.98392Z" fill="currentColor"/>',
      width: 13
    },
    description: 'Arbitrum One is developed by Offchain Labs. It uses an optimistic rollup approach and is fully EVM compatible, making it developer-friendly.'
  },
  {
    id: 'arbitrum_nova',
    name: 'Arbitrum Nova',
    shortName: 'Arbitrum Nova',
    caip2: 'eip155:42170',
    isOrbitChain: true,
    orbitMetadata: {
      parentChain: 'Ethereum',
      deployerTeam: 'Offchain Labs',
      status: 'Mainnet',
      layer: 2,
      category: 'gaming'
    },
    colors: {
      light: ['#EF6627', '#EF6627'],
      dark: ['#EF6627', '#EF6627'],
      darkTextOnBackground: true
    },
    logo: {
      body: '<path d="M7.48715 0.930011C7.52341 0.930011 7.55685 0.939283 7.59029 0.95747L13.0311 4.13869C13.0948 4.17542 13.1342 4.24318 13.1342 4.31664V10.6787C13.1342 10.7525 13.0948 10.8199 13.0311 10.8567L7.59029 14.0407C7.56002 14.0593 7.52376 14.0682 7.48715 14.0682C7.45054 14.0682 7.41745 14.0589 7.38401 14.0407L1.94636 10.8602C1.88265 10.8235 1.84322 10.7558 1.84322 10.6823V4.31699C1.84322 4.24318 1.88265 4.17578 1.94636 4.13905L7.38401 0.957826C7.41745 0.939283 7.45054 0.930011 7.48715 0.930011ZM7.48715 0C7.29319 0 7.09922 0.0520635 6.92638 0.153694L1.48557 3.33421C1.13989 3.53675 0.924805 3.91154 0.924805 4.31699V10.6791C0.924805 11.0845 1.13989 11.459 1.48557 11.6647L6.92638 14.8459C7.09922 14.9472 7.29319 14.9996 7.48715 14.9996C7.68111 14.9996 7.87507 14.9476 8.04792 14.8459L13.4887 11.6647C13.8372 11.4622 14.0495 11.0874 14.0495 10.6791V4.31699C14.0495 3.91154 13.8344 3.53711 13.4887 3.33135L8.04792 0.150128C7.87507 0.0488541 7.68111 0 7.48715 0Z" fill="currentColor"/><path d="M6.09853 4.24085H5.38921C5.33465 4.24085 5.28924 4.27473 5.27093 4.32679L2.98245 10.6736C2.96732 10.7167 2.99759 10.7595 3.043 10.7595H3.75232C3.80688 10.7595 3.85229 10.7256 3.8706 10.6736L6.15591 4.32359C6.17421 4.28365 6.14429 4.24085 6.09853 4.24085Z" fill="currentColor"/><path d="M7.0203 6.70352C6.99918 6.64824 6.92033 6.64824 6.90202 6.70352L6.53205 7.7291C6.5229 7.75655 6.5229 7.78758 6.53205 7.81825L7.56276 10.6771C7.58107 10.7292 7.62929 10.763 7.68104 10.763H8.39036C8.43577 10.763 8.46604 10.7199 8.45091 10.6771L7.0203 6.70352Z" fill="currentColor"/><path d="M7.34167 4.24085H6.63235C6.57779 4.24085 6.53238 4.27473 6.51407 4.32679L4.22876 10.6736C4.21362 10.7167 4.2439 10.7595 4.28931 10.7595H4.99863C5.05319 10.7595 5.0986 10.7256 5.11691 10.6736L7.40222 4.32359C7.41735 4.28365 7.38708 4.24085 7.34167 4.24085Z" fill="currentColor"/><path d="M7.64127 4.97443C7.62015 4.91916 7.5413 4.91916 7.52299 4.97443L7.15337 6.00001C7.14422 6.02747 7.14422 6.05849 7.15337 6.08916L8.8054 10.6736C8.8237 10.7257 8.87193 10.7595 8.92368 10.7595H9.633C9.67841 10.7595 9.70868 10.7164 9.69354 10.6736L7.64127 4.97443Z" fill="currentColor"/><path d="M11.9307 4.24085H11.2214C11.1668 4.24085 11.1214 4.27473 11.1031 4.32679L9.44824 8.91124C9.43909 8.9387 9.43909 8.96972 9.44824 9.00039L9.81821 10.026C9.83933 10.0812 9.91818 10.0812 9.93649 10.026L11.9884 4.32715C12.0035 4.284 11.9733 4.24085 11.9307 4.24085Z" fill="currentColor"/><path d="M9.19628 8.29717C9.2174 8.35245 9.29625 8.35245 9.31456 8.29717L10.7452 4.32679C10.7603 4.28365 10.73 4.24085 10.6846 4.24085H9.9753C9.92073 4.24085 9.87532 4.27473 9.85702 4.32679L8.82631 7.18565C8.81715 7.21311 8.81715 7.24413 8.82631 7.2748L9.19628 8.29717Z" fill="currentColor"/>',
      width: 15,
      height: 15
    },
    description: 'Arbitrum Nova is an Optimium developed by Offchain using AnyTrust protocol. As part of the Nitro stack Arbitrum Nova is fully EVM compatible.'
  },
  {
    id: 'abstract',
    name: 'Abstract',
    shortName: 'Abstract',
    caip2: 'eip155:2741',
    chainId: 2741,
    colors: {
      light: ['#111827', '#111827'],
      dark: ['#111827', '#111827'],
      darkTextOnBackground: false
    },
    logo: null,
    description: 'The mainnet for Abstract.'
  },
  {
    id: 'base',
    name: 'Base',
    shortName: 'Base',
    caip2: 'eip155:8453',
    colors: {
      light: ['#2151F5', '#2151F5'],
      dark: ['#2151F5', '#2151F5'],
      darkTextOnBackground: false
    },
    logo: {
      body: '<g fill="none"><path d="M7.48692 15C11.6363 15 15 11.6422 15 7.5C15 3.35786 11.6363 0 7.48692 0C3.55025 0 0.320738 3.02245 0 6.86958H9.93056V8.13042H5.39358e-08C0.320739 11.9775 3.55025 15 7.48692 15Z" fill="currentColor"/></g>',
      width: 15,
      height: 15
    },
    description: 'Base is an Ethereum Layer 2 offering a secure, low-cost, builder-friendly way for anyone, anywhere, to build onchain.'
  },
  {
    id: 'celo',
    name: 'Celo',
    shortName: 'Celo',
    caip2: 'eip155:42220',
    colors: {
      light: ['#FCFF52', '#FCFF52'],
      dark: ['#FCFF52', '#FCFF52'],
      darkTextOnBackground: true
    },
    logo: {
      body: '<path d="M14 1H1V14H14V9.46188H11.8413C11.0979 11.1183 9.42454 12.2689 7.51018 12.2689C4.86945 12.2689 2.73107 10.1102 2.73107 7.48982C2.72768 4.86945 4.86945 2.73107 7.51018 2.73107C9.46188 2.73107 11.1352 3.91906 11.8786 5.61279H14V1Z" fill="currentColor"/>',
      width: 15,
      height: 15
    },
    description: 'Mobile-first. Celo has the mission to build a regenerative digital economy that fosters prosperity for all. It migrated from being an L1 to an L2 in 2025.'
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    shortName: 'Ethereum L1',
    caip2: 'eip155:1',
    colors: {
      light: ['#94ABD3', '#94ABD3'],
      dark: ['#94ABD3', '#94ABD3'],
      darkTextOnBackground: true
    },
    logo: {
      body: '<g fill="none"><g clip-path="url(#svgID0)"><g fill="currentColor" clip-path="url(#svgID1)"><path d="M4.499 10.898v3.64l4.478-6.276-4.478 2.636Zm0-5.514v4.671l4.477-2.642L4.5 5.383Z"/><path d="M4.499 0v5.383l4.477 2.03L4.5 0ZM4.5 10.898v3.64L.021 8.261l4.477 2.636Zm0-5.514v4.671L.021 7.414l4.477-2.03ZM4.499 0v5.383L.022 7.413 4.499 0Z"/></g></g><defs><clipPath id="svgID0"><path fill="#fff" d="M0 0h9v14.539H0z"/></clipPath><clipPath id="svgID1"><path fill="#fff" d="M.021 0h8.957v14.539H.021z"/></clipPath></defs></g>',
      width: 9
    },
    description: 'Ethereum, proposed by Vitalik Buterin in 2013 and launched in 2015, is the most decentralized smart contract to date and aiming to scale via Layer 2s.'
  },
  {
    id: 'linea',
    name: 'Linea',
    shortName: 'Linea',
    caip2: 'eip155:59144',
    colors: {
      light: ['#9CE5FF', '#9CE5FF'],
      dark: ['#A9E9FF', '#A9E9FF'],
      darkTextOnBackground: true
    },
    logo: {
      body: "<g clip-path='url(#clip0_4148_14743)'><path d='M10.966 13.9999H1V3.10938H3.28024V11.8893H10.966V13.9988V13.9999Z' fill='currentColor'/><path d='M10.966 5.21895C12.0893 5.21895 13 4.27451 13 3.10948C13 1.94444 12.0893 1 10.966 1C9.84266 1 8.93201 1.94444 8.93201 3.10948C8.93201 4.27451 9.84266 5.21895 10.966 5.21895Z' fill='currentColor'/></g><defs><clipPath id='clip0_4148_14743'><rect width='12' height='13' fill='white' transform='translate(1 1)'/></clipPath></defs>",
      width: 15,
      height: 15
    },
    description: 'Linea is a developer-friendly ZK Rollup by ConsenSys, enhancing Ethereum by enabling a new wave of decentralized applications.'
  },
  {
    id: 'mantle',
    name: 'Mantle',
    shortName: 'Mantle',
    caip2: 'eip155:5000',
    colors: {
      light: ['#08373C', '#08373C'],
      dark: ['#10808C', '#10808C'],
      darkTextOnBackground: false
    },
    logo: {
      body: "<path d='M3.67566 5.55848L1.70427 4.55469C1.54959 4.85747 1.41959 5.17507 1.31427 5.49924L3.41895 6.18051C3.48807 5.96659 3.57364 5.7576 3.67566 5.55848Z' fill='currentColor'/><path d='M5.34926 3.78868L6.44027 5.66957C6.59989 5.57742 6.77103 5.50666 6.94711 5.45894L6.38268 3.35919C6.52584 3.32134 6.6723 3.28843 6.8204 3.26539L6.47318 1.08008C6.13749 1.13274 5.80344 1.21337 5.4809 1.31869L6.15559 3.38881C5.94002 3.45957 5.73103 3.54679 5.53027 3.64881L4.53964 1.71198C4.2385 1.86666 3.94559 2.04603 3.67242 2.24679L4.97571 4.03223C5.09584 3.94501 5.2209 3.86438 5.34926 3.78868Z' fill='currentColor'/><path d='M11.2091 5.34743L9.32825 6.44008C9.4204 6.5997 9.4928 6.77084 9.54053 6.94692L11.6403 6.38084C11.6798 6.52401 11.711 6.67046 11.7341 6.81692L13.9194 6.4697C13.8667 6.13401 13.7861 5.79996 13.6791 5.47742L11.6107 6.1554C11.5399 5.93983 11.4527 5.73084 11.3507 5.53008L13.2875 4.53616C13.1328 4.23502 12.9534 3.94211 12.7527 3.66895L10.9672 4.97388C11.0528 5.09401 11.1334 5.21907 11.2091 5.34743Z' fill='currentColor'/><path d='M10.4423 1.7025C10.1395 1.54782 9.82191 1.41782 9.49773 1.3125L8.81812 3.41718C9.03039 3.4863 9.23938 3.57187 9.44014 3.67389L10.4423 1.7025Z' fill='currentColor'/><path d='M9.65569 3.75159L8.55151 5.66868C8.71113 5.76083 8.85924 5.87437 8.98924 6.00437L12.0862 2.89589C11.8459 2.65564 11.5843 2.43349 11.3111 2.23438L10.0342 3.99678C9.9124 3.90792 9.78734 3.82564 9.65569 3.75159Z' fill='currentColor'/><path d='M3.75135 5.34035L5.66679 6.44618C5.75894 6.28656 5.87249 6.13845 6.00249 6.00681L2.8973 2.9082C2.65704 3.14846 2.43489 3.4101 2.23578 3.68327L3.99654 4.96187C3.90932 5.08364 3.82704 5.21035 3.75135 5.34035Z' fill='currentColor'/><path d='M8.16974 3.2281L8.50379 1.07734C8.17303 1.02633 7.83569 1 7.49834 1H7.49341V5.38709H7.49834C7.68265 5.38709 7.86695 5.41012 8.04303 5.45784L8.61075 3.32025C8.46594 3.28076 8.31948 3.25114 8.16974 3.2281Z' fill='currentColor'/><path d='M5.45784 6.95511L3.32025 6.38574C3.2824 6.53055 3.25114 6.67865 3.2281 6.82675L1.07734 6.49106C1.02633 6.82182 1 7.16245 1 7.49979H5.38709C5.38709 7.31384 5.41177 7.13118 5.45784 6.95511Z' fill='currentColor'/><path d='M11.3243 9.44136L13.2957 10.4452C13.4504 10.1424 13.5804 9.82478 13.6857 9.5006L11.581 8.81934C11.5119 9.03326 11.4264 9.24225 11.3243 9.44136Z' fill='currentColor'/><path d='M9.64912 11.209L8.5581 9.32812C8.39848 9.42028 8.22735 9.49104 8.05127 9.53876L8.6157 11.6385C8.47253 11.6764 8.32608 11.7093 8.17798 11.7323L8.52519 13.9176C8.86089 13.865 9.19494 13.7843 9.51747 13.679L8.84279 11.6089C9.05836 11.5381 9.26734 11.4509 9.4681 11.3489L10.4604 13.2857C10.7615 13.131 11.0544 12.9517 11.3276 12.7509L10.0243 10.9638C9.90418 11.0543 9.77912 11.135 9.64912 11.209Z' fill='currentColor'/><path d='M3.79088 9.65192L5.67176 8.55762C5.57961 8.398 5.50721 8.22686 5.45949 8.05078L3.35974 8.61686C3.32025 8.47369 3.28898 8.32724 3.26594 8.18078L1.08063 8.528C1.13329 8.86369 1.21392 9.19774 1.32088 9.52027L3.38936 8.84395C3.46012 9.05787 3.54734 9.2685 3.64936 9.46926L1.71253 10.4632C1.86721 10.7643 2.04658 11.0572 2.24734 11.3304L4.03278 10.0255C3.94721 9.90534 3.86658 9.78027 3.79088 9.65192Z' fill='currentColor'/><path d='M4.55774 13.2966C4.86052 13.4513 5.17812 13.5813 5.5023 13.6866L6.18191 11.5819C5.96964 11.5128 5.76065 11.4272 5.55989 11.3252L4.55774 13.2966Z' fill='currentColor'/><path d='M5.34268 11.2489L6.44685 9.33179C6.28723 9.23964 6.13913 9.12609 6.00913 8.99609L2.91217 12.1046C3.15242 12.3448 3.41407 12.567 3.68723 12.7661L4.96419 11.0037C5.08597 11.0909 5.21268 11.1732 5.34268 11.2489Z' fill='currentColor'/><path d='M11.247 9.65856L9.33155 8.55273C9.23939 8.71235 9.12585 8.86046 8.99585 8.9921L12.1027 12.0907C12.3429 11.8505 12.5651 11.5888 12.7642 11.3156L11.0034 10.037C11.0907 9.91362 11.1729 9.78856 11.247 9.65856Z' fill='currentColor'/><path d='M6.95529 9.54199L6.38757 11.6796C6.53238 11.7174 6.68049 11.7487 6.82859 11.7717L6.49454 13.9225C6.82529 13.9735 7.16264 13.9998 7.49998 13.9998H7.50491V9.61275H7.49998C7.31567 9.61275 7.13137 9.58807 6.95529 9.54199Z' fill='currentColor'/><path d='M9.61293 7.5C9.61293 7.68595 9.5899 7.86861 9.54218 8.04468L11.6798 8.61405C11.7176 8.46924 11.7489 8.32114 11.7719 8.17304L13.9227 8.50873C13.9737 8.17797 14 7.83734 14 7.5H9.61293Z' fill='currentColor'/>",
      width: 15,
      height: 15
    },
    description: 'Mantle is an OVM based EVM-compatible rollup. Public launch was in July 2023.'
  },
  {
    id: 'mode',
    name: 'Mode Network',
    shortName: 'Mode',
    caip2: 'eip155:34443',
    colors: {
      light: ['#C4DF00', '#C4DF00'],
      dark: ['#C4DF00', '#C4DF00'],
      darkTextOnBackground: true
    },
    logo: {
      body: '<path d="M14.9868 13.9974H12.0607V7.52067L13.2322 3.82631L12.4011 3.53696L8.60686 13.9974H6.37995L2.58311 3.53696L1.75462 3.82631L2.92612 7.52067V14H0V1H4.3562L7.05805 8.44038V10.626H7.94195V8.44038L10.6438 1H15V13.9974H14.9868Z" fill="currentColor"/>',
      width: 15,
      height: 15
    },
    description: 'Mode is an Optimistic Rollup and part of the Superchain.'
  },
  {
    id: 'optimism',
    name: 'OP Mainnet',
    shortName: 'OP Mainnet',
    caip2: 'eip155:10',
    colors: {
      light: ['#DD3408', '#DD3408'],
      dark: ['#FE5468', '#FE5468'],
      darkTextOnBackground: false
    },
    logo: {
      body: '<path d="M7.50001 0C3.35824 0 0 3.35824 0 7.5C0 11.6418 3.35824 15 7.50001 15C11.6418 15 15 11.6418 15 7.5C15 3.35824 11.6418 0 7.50001 0ZM7.50001 11.3187V14.1209C4.61757 14.1209 2.28023 11.7835 2.28023 8.90111C2.28023 6.01867 4.61757 3.68134 7.50001 3.68134V0.87912C10.3824 0.87912 12.7198 3.21649 12.7198 6.09889C12.7198 8.98132 10.3824 11.3187 7.50001 11.3187ZM10.0824 7.47581V7.52419C8.94394 8.09122 8.09119 8.94394 7.52419 10.0824H7.47582C6.90878 8.94394 6.05603 8.09122 4.91757 7.52419V7.47581C6.05603 6.90877 6.90878 6.05606 7.47582 4.9176H7.52419C8.09119 6.05606 8.94394 6.90877 10.0824 7.47581Z" fill="currentColor"/>',
      width: 15,
      height: 15
    },
    description: 'OP Mainnet uses an optimistic rollup approach and is one of the oldest rollups. It is fully EVM compatible and it\'s tech-stack is widely used.'
  },
  {
    id: 'scroll',
    name: 'Scroll',
    shortName: 'Scroll',
    caip2: 'eip155:534352',
    colors: {
      light: ['#FBB90D', '#FBB90D'],
      dark: ['#FFDF27', '#FFDF27'],
      darkTextOnBackground: true,
    },
    logo: {
      body: "<path d='M2.62068 6.01142C2.12432 5.5332 1.77297 4.91315 1.77297 4.17341L1.77409 4.09512C1.81368 2.83915 2.83093 1.82824 4.06456 1.78796L11.932 1.78683C12.1384 1.79477 12.304 1.94567 12.304 2.15784V8.92785C12.4858 8.96132 12.5723 8.98402 12.7468 9.04869C12.8829 9.09918 13.0764 9.21036 13.0764 9.21036V2.1584C13.0647 1.5168 12.565 1 11.932 1H4.06401C2.36748 1.02836 1 2.43808 1 4.17398C1 5.18148 1.45118 6.04036 2.19069 6.64509C2.23977 6.68536 2.28885 6.73812 2.42158 6.73755C2.65358 6.73699 2.81587 6.55205 2.80639 6.34669C2.79858 6.17764 2.72831 6.11581 2.62068 6.01199V6.01142Z' fill='currentColor'/><path d='M11.7313 9.37658H5.55978C5.1454 9.37998 4.81078 9.72262 4.81078 10.1453V11.0455C4.82305 11.4625 5.17217 11.8199 5.58487 11.8199H6.0433V11.0455H5.58487V10.164H5.83528C6.61383 10.164 7.18715 10.9014 7.18715 11.6883C7.18715 12.3855 6.56364 13.279 5.51516 13.2075C4.58491 13.1439 4.08522 12.3032 4.08522 11.6883V4.03783C4.08522 3.69235 3.80971 3.41211 3.46951 3.41211H2.85437V4.1927H3.31168V11.6883C3.28826 13.2126 4.37912 13.9813 5.51516 13.9813L11.7307 14C12.9839 14 14 12.9652 14 11.6883C14 10.4113 12.9839 9.37658 11.7307 9.37658H11.7313ZM13.227 11.7382C13.2008 12.5568 12.5416 13.2126 11.7313 13.2126L7.40576 13.1956C7.75154 12.79 7.95956 12.2624 7.95956 11.6883C7.95956 10.7846 7.4303 10.164 7.4303 10.164H11.7313C12.5578 10.164 13.2276 10.8464 13.2276 11.6883V11.7382H13.227Z' fill='currentColor'/><path d='M10.0704 3.55273H5.41864V4.33332H10.0704C10.2823 4.33332 10.4541 4.1586 10.4541 3.94303C10.4541 3.72746 10.2823 3.55273 10.0704 3.55273Z' fill='currentColor'/><path d='M10.0704 7.2373H5.41864V8.01789H10.0704C10.2823 8.01789 10.4541 7.84317 10.4541 7.6276C10.4541 7.41203 10.2823 7.2373 10.0704 7.2373Z' fill='currentColor'/><path d='M10.8886 5.39551H5.41864V6.1761H10.8891C11.1011 6.1761 11.2728 6.00137 11.2728 5.7858C11.2728 5.57023 11.1011 5.39551 10.8891 5.39551H10.8886Z' fill='currentColor'/>",
      width: 15,
      height: 15,
    },
    description: 'Scroll is a general purpose zkEVM rollup. Public launch was in October 2023.',
  },
  {
    id: 'swell',
    name: 'Swellchain',
    shortName: 'Swellchain',
    caip2: 'eip155:1923',
    colors: {
      light: ['#2956DE', '#2956DE'],
      dark: ['#2956DE', '#2956DE'],
      darkTextOnBackground: true,
    },
    logo: {
      body: "<path d=\"M14.3695 9.08874L14.3506 9.10865C14.3417 9.11779 14.3328 9.12688 14.3237 9.13591L9.12888 14.3224C8.22394 15.2259 6.75674 15.2259 5.85179 14.3224L4.41724 12.8902C4.31553 12.7891 4.31532 12.6246 4.41656 12.523C4.44635 12.4931 4.48297 12.4709 4.52324 12.4584C6.06085 11.9837 7.31024 11.4358 8.27132 10.8147C10.5602 9.33538 12.5929 8.76009 14.3695 9.08874ZM13.2804 4.82229C15.1984 5.42668 14.9746 6.83762 15 7.39385C12.8995 6.29244 10.3726 6.69615 7.41924 8.60488C5.21794 10.0276 3.374 10.6141 1.88744 10.3646C0.400877 10.115 0.0664788 8.2995 0 7.81706C1.63346 8.64297 3.82253 8.16894 6.56715 6.39512C9.12471 4.74221 11.3625 4.21791 13.2804 4.82229ZM9.12888 0.677615L10.4768 2.0232C10.5784 2.1245 10.5785 2.28899 10.4772 2.39052C10.4411 2.42675 10.395 2.45149 10.3449 2.46159C8.39353 2.85471 6.83294 3.42929 5.66312 4.18535C3.6585 5.48091 1.95023 6.08309 0.538321 5.99188L0.538474 5.9915L5.85179 0.677615C6.75674 -0.225872 8.22394 -0.225872 9.12888 0.677615Z\" fill=\"currentColor\"/>",
      width: 15,
      height: 15,
    },
    description: 'Swellchain operates as a restaking-focused L2 built on the OP Stack. It aims to extend ETH security through EigenLayer restaking while using OP infra',
  },
  {
    id: 'taiko',
    name: 'Taiko Alethia',
    shortName: 'Taiko',
    caip2: 'eip155:167000',
    colors: {
      light: ['#E81899', '#E81899'],
      dark: ['#E81899', '#E81899'],
      darkTextOnBackground: true,
    },
    logo: {
      body: "<path d=\"M14.6848 12.3092L12.1144 8.66764C11.8352 8.27191 11.4217 8.03484 10.9814 7.98258C10.8812 7.97051 10.7917 7.90984 10.7416 7.81837C10.6905 7.72691 10.6852 7.61584 10.7255 7.51877C10.9018 7.0951 10.9125 6.60324 10.7228 6.15343L8.98387 2.01165C8.7261 1.39664 8.14348 1 7.50001 1C6.85653 1 6.27391 1.39757 6.01614 2.01165L4.27722 6.15343C4.08837 6.60324 4.09822 7.0951 4.27453 7.51877C4.3148 7.61584 4.30854 7.72691 4.25842 7.81837C4.20741 7.90984 4.1188 7.97051 4.01856 7.98258C3.57824 8.03484 3.16477 8.27191 2.88554 8.66764L0.315181 12.3092C-0.0660784 12.8495 -0.104559 13.5737 0.216732 14.1551C0.538925 14.7356 1.16003 15.0632 1.79904 14.9895L6.10833 14.4893C6.57638 14.4351 6.98004 14.1803 7.24313 13.8089C7.3031 13.724 7.39887 13.6736 7.50001 13.6736C7.60115 13.6736 7.69602 13.724 7.75688 13.8089C8.01997 14.1803 8.42363 14.4351 8.89168 14.4893L13.201 14.9895C13.84 15.0642 14.4611 14.7366 14.7833 14.1551C15.1046 13.5737 15.0661 12.8495 14.6848 12.3092ZM5.4013 6.67324L7.14288 2.5268C7.20554 2.37842 7.34606 2.28229 7.5009 2.28229C7.65574 2.28229 7.79621 2.37842 7.85886 2.5268L9.6005 6.67324C9.6551 6.8039 9.64346 6.9551 9.56828 7.07457C9.49309 7.19404 9.366 7.26584H5.77269C5.63581 7.26584 5.50781 7.19404 5.43263 7.07457C5.35745 6.9551 5.34581 6.8039 5.40041 6.67324H5.4013ZM6.29539 12.9858C6.23364 13.1137 6.1137 13.1995 5.97765 13.2153L1.6639 13.7156C1.50997 13.7333 1.35961 13.6549 1.28175 13.5149C1.20388 13.3749 1.21373 13.2004 1.30591 13.0698L3.87895 9.42452C3.96039 9.30972 4.09106 9.24438 4.22799 9.25278C4.36492 9.26025 4.48843 9.33958 4.55733 9.46365L4.56002 9.46832L6.28286 12.5798L6.28555 12.5845C6.35447 12.7086 6.35805 12.8598 6.29629 12.9867L6.29539 12.9858ZM7.85438 11.5785C7.78105 11.71 7.64679 11.7921 7.50001 11.7921C7.35411 11.7921 7.21896 11.7109 7.14557 11.5794L5.82191 9.18932C5.74852 9.05772 5.74852 8.89438 5.82191 8.76278C5.89531 8.63124 6.02957 8.54911 6.17635 8.54911H8.82276C8.96866 8.54911 9.10381 8.62938 9.1772 8.76185C9.25054 8.89438 9.25054 9.05678 9.1772 9.18838L7.85438 11.5785ZM13.7191 13.5149C13.6413 13.6549 13.4918 13.7343 13.337 13.7165L9.02325 13.2163C8.88721 13.2004 8.76727 13.1146 8.70551 12.9867C8.64376 12.8589 8.64734 12.7077 8.71625 12.5845L8.71894 12.5798L10.4418 9.46832L10.4445 9.46365C10.5134 9.33958 10.6368 9.26025 10.7738 9.25278C10.9107 9.24532 11.0414 9.30972 11.1229 9.42452L13.6959 13.0698C13.7881 13.2004 13.797 13.3749 13.72 13.5149H13.7191Z\" fill=\"currentColor\"/>",
      width: 15,
      height: 15,
    },
    description: 'Taiko Alethia is a based, general purpose type-1 zk-rollup built to scale Ethereum without compromising decentralization.',
  },
  {
    id: 'zksync_era',
    name: 'ZKsync Era',
    shortName: 'ZKsync Era',
    caip2: 'eip155:324',
    colors: {
      light: ['#390094', '#390094'],
      dark: ['#2E3EC7', '#2E3EC7'],
      darkTextOnBackground: false,
    },
    logo: {
      body: "<g clip-path=\"url(#clip0_769_11354)\">\r\n<g clip-path=\"url(#clip1_769_11354)\">\r\n<mask id=\"mask0_769_11354\" style=\"mask-type:luminance\" maskUnits=\"userSpaceOnUse\" x=\"0\" y=\"3\" width=\"43\" height=\"9\">\r\n<path d=\"M42.8571 3.57227H-6.10352e-05V11.9478H42.8571V3.57227Z\" fill=\"white\"/>\r\n</mask>\r\n<g mask=\"url(#mask0_769_11354)\">\r\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M14.8764 7.68336L10.6563 3.57422V6.58355L6.46625 9.59663L10.6563 9.59944V11.7925L14.8764 7.68336Z\" fill=\"currentColor\"/>\r\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M-0.000976562 7.68141L4.21905 11.7906V8.80539L8.4092 5.76813L4.21905 5.76532V3.57227L-0.000976562 7.68141Z\" fill=\"currentColor\"/>\r\n</g>\r\n</g>\r\n</g>\r\n<defs>\r\n<clipPath id=\"clip0_769_11354\">\r\n<rect width=\"15\" height=\"15\" fill=\"white\"/>\r\n</clipPath>\r\n<clipPath id=\"clip1_769_11354\">\r\n<rect width=\"42.8571\" height=\"8.57143\" fill=\"white\" transform=\"translate(0 3.57129)\"/>\r\n</clipPath>\r\n</defs>\r\n",
      width: 15,
      height: 15,
    },
    description: 'ZKsync Era uses ZK tech, aiming to boost throughput while preserving Ethereum\'s core values: freedom, self-sovereignty, and decentralization.',
  },
  {
    id: 'zora',
    name: 'Zora',
    shortName: 'Zora',
    caip2: 'eip155:7777777',
    colors: {
      light: ['#2FB9F4', '#2FB9F4'],
      dark: ['#2FB9F4', '#2FB9F4'],
      darkTextOnBackground: false,
    },
    logo: {
      body: "<path fill-rule='evenodd' clip-rule='evenodd' d='M7.5 15C11.6421 15 15 11.6421 15 7.5C15 7.23248 14.986 6.96823 14.9587 6.70794C14.6084 9.68801 12.0742 12 9 12C5.68629 12 3 9.31371 3 6C3 2.92581 5.31199 0.391616 8.29206 0.0413265C8.03177 0.0140066 7.76752 0 7.5 0C3.35786 0 0 3.35786 0 7.5C0 11.6421 3.35786 15 7.5 15ZM9 11C11.7614 11 14 8.76142 14 6C14 3.23858 11.7614 1 9 1C6.23858 1 4 3.23858 4 6C4 8.76142 6.23858 11 9 11ZM13 4.5C13 5.88071 11.8807 7 10.5 7C9.11929 7 8 5.88071 8 4.5C8 3.11929 9.11929 2 10.5 2C11.8807 2 13 3.11929 13 4.5Z' fill='currentColor'/>",
      width: 15,
      height: 15,
    },
    description: 'Zora is a fully EVM compatible optimistic rollup built on the OP Stack with focus on NFTs.',
  },
  {
    id: 'unichain',
    name: 'Unichain',
    shortName: 'Unichain',
    caip2: 'eip155:130',
    colors: {
      light: ['#FF47BB', '#FF47BB'],
      dark: ['#FF47BB', '#FF47BB'],
      darkTextOnBackground: true
    },
    logo: {
      body: '<path d="M15 7.3573C10.9348 7.3573 7.64271 4.06195 7.64271 0H7.35734V7.3573H0V7.64272C4.06528 7.64272 7.35734 10.9381 7.35734 15H7.64271V7.64272H15V7.3573Z" fill="currentColor"/>',
      width: 15,
      height: 15
    },
    description: 'Unichain is a Layer 2 optimistic rollup built on the OP Stack, designed to enhance the Uniswap ecosystem with faster and cheaper transactions.'
  },
  {
    id: 'polygon',
    name: 'Polygon',
    shortName: 'Polygon',
    caip2: 'eip155:137',
    colors: {
      light: ['#8247E5', '#8247E5'],
      dark: ['#8247E5', '#8247E5'],
      darkTextOnBackground: false
    },
    logo: {
      body: '<path d="M11.2217 4.36621L9.11719 3.07812C8.68555 2.8125 8.09766 2.8125 7.66602 3.07812L5.56152 4.36621L3.95703 5.32812C3.52539 5.59375 2.9375 5.59375 2.50586 5.32812L1.60156 4.76562C1.16992 4.5 0.917969 4.02344 0.917969 3.49219V2.42188C0.917969 1.89062 1.11523 1.41406 1.60156 1.14844L2.50586 0.585938C2.9375 0.320312 3.52539 0.320312 3.95703 0.585938L4.86133 1.14844C5.29297 1.41406 5.54492 1.89062 5.54492 2.42188V3.60156L7.09766 2.66406V1.48438C7.09766 0.953125 6.90039 0.476562 6.41406 0.210938L3.01172 -1.52588e-05C2.58008 -0.265631 1.99219 -0.265631 1.56055 -1.52588e-05L-1.80664 0.210938C-2.29297 0.476562 -2.54492 0.953125 -2.54492 1.48438V4.76562C-2.54492 5.29688 -2.34766 5.77344 -1.86133 6.03906L1.54102 8.24219C1.97266 8.50781 2.56055 8.50781 2.99219 8.24219L5.54492 6.73438L7.09766 5.79688L9.60156 4.28906C10.0332 4.02344 10.6211 4.02344 11.0527 4.28906L11.957 4.85156C12.3887 5.11719 12.6406 5.59375 12.6406 6.125V7.19531C12.6406 7.72656 12.4434 8.20312 11.957 8.46875L11.0527 9.03125C10.6211 9.29688 10.0332 9.29688 9.60156 9.03125L8.69727 8.46875C8.26562 8.20312 8.01367 7.72656 8.01367 7.19531V6.01562L6.46094 6.95312V8.13281C6.46094 8.66406 6.6582 9.14062 7.14453 9.40625L10.5469 11.6094C10.9785 11.875 11.5664 11.875 11.998 11.6094L15.4004 9.40625C15.8867 9.14062 16.1387 8.66406 16.1387 8.13281V4.85156C16.1387 4.32031 15.9414 3.84375 15.4551 3.57812L11.2217 4.36621Z" fill="currentColor"/>',
      width: 17,
      height: 12
    },
    description: 'Polygon is a popular sidechain/commit-chain that uses Plasma and Proof-of-Stake. It offers fast and cheap transactions for Ethereum DApps.'
  },
  {
    id: 'bnb_chain',
    name: 'BNB Smart Chain',
    shortName: 'BNB Chain',
    caip2: 'eip155:56',
    colors: {
      light: ['#F0B90B', '#F0B90B'],
      dark: ['#F0B90B', '#F0B90B'],
      darkTextOnBackground: true
    },
    logo: {
      body: '<path d="M7.5 1.5L9.5 3.5L7.5 5.5L5.5 3.5L7.5 1.5ZM2.5 4.5L4.5 6.5L2.5 8.5L0.5 6.5L2.5 4.5ZM12.5 4.5L14.5 6.5L12.5 8.5L10.5 6.5L12.5 4.5ZM7.5 7.5L11.5 11.5L9.5 13.5L7.5 11.5L5.5 13.5L3.5 11.5L7.5 7.5Z" fill="currentColor"/>',
      width: 15,
      height: 15
    },
    description: 'BNB Smart Chain is a blockchain platform developed by Binance, offering fast and low-cost transactions with EVM compatibility.'
  },
  {
    id: 'avalanche',
    name: 'Avalanche C-Chain',
    shortName: 'Avalanche',
    caip2: 'eip155:43114',
    colors: {
      light: ['#E84142', '#E84142'],
      dark: ['#E84142', '#E84142'],
      darkTextOnBackground: false
    },
    logo: {
      body: '<path d="M12.2812 9.0625H10.5938L7.5 3.75L4.40625 9.0625H2.71875L7.5 0.9375L12.2812 9.0625ZM8.90625 11.25H6.09375C5.76562 11.25 5.51562 11.4844 5.625 11.7969L6.32812 13.5938C6.42188 13.8281 6.65625 14.0625 6.89062 14.0625H8.10938C8.34375 14.0625 8.57812 13.8281 8.67188 13.5938L9.375 11.7969C9.48438 11.4844 9.23438 11.25 8.90625 11.25ZM11.7188 11.25H10.3125C9.98438 11.25 9.73438 11.4844 9.84375 11.7969L10.2656 12.8906C10.3594 13.125 10.5938 13.3594 10.8281 13.3594H11.4844C11.7188 13.3594 11.9531 13.125 12.0469 12.8906L12.4688 11.7969C12.5781 11.4844 12.3281 11.25 11.7188 11.25ZM4.6875 11.25H3.28125C2.95312 11.25 2.70312 11.4844 2.8125 11.7969L3.23438 12.8906C3.32812 13.125 3.5625 13.3594 3.79688 13.3594H4.45312C4.6875 13.3594 4.92188 13.125 5.01562 12.8906L5.4375 11.7969C5.54688 11.4844 5.29688 11.25 4.6875 11.25Z" fill="currentColor"/>',
      width: 15,
      height: 15
    },
    description: 'Avalanche is a fast, low-cost blockchain platform with sub-second finality and high throughput, fully compatible with Ethereum tools and dApps.'
  },
  {
    id: 'fantom',
    name: 'Fantom',
    shortName: 'Fantom',
    caip2: 'eip155:250',
    colors: {
      light: ['#1969FF', '#1969FF'],
      dark: ['#1969FF', '#1969FF'],
      darkTextOnBackground: false
    },
    logo: {
      body: '<path d="M7.5 0L2.68945 2.84375V12.1562L7.5 15L12.3105 12.1562V2.84375L7.5 0ZM10.8223 10.9395L7.5 12.7734L4.17773 10.9395V4.06055L7.5 2.22656L10.8223 4.06055V10.9395ZM9.375 5.625H5.625V6.5625H9.375V5.625ZM9.375 7.5H5.625V8.4375H9.375V7.5ZM8.4375 9.375H5.625V10.3125H8.4375V9.375Z" fill="currentColor"/>',
      width: 15,
      height: 15
    },
    description: 'Fantom is a high-performance, scalable blockchain platform using a novel consensus mechanism called Lachesis for near-instant transactions.'
  },
  {
    id: 'polygon_zkevm',
    name: 'Polygon zkEVM',
    shortName: 'Polygon zkEVM',
    caip2: 'eip155:1101',
    colors: {
      light: ['#8945FF', '#8945FF'],
      dark: ['#8945FF', '#8945FF'],
      darkTextOnBackground: false
    },
    logo: {
      body: '<path d="M11.2217 4.36621L9.11719 3.07812C8.68555 2.8125 8.09766 2.8125 7.66602 3.07812L5.56152 4.36621L3.95703 5.32812C3.52539 5.59375 2.9375 5.59375 2.50586 5.32812L1.60156 4.76562C1.16992 4.5 0.917969 4.02344 0.917969 3.49219V2.42188C0.917969 1.89062 1.11523 1.41406 1.60156 1.14844L2.50586 0.585938C2.9375 0.320312 3.52539 0.320312 3.95703 0.585938L4.86133 1.14844C5.29297 1.41406 5.54492 1.89062 5.54492 2.42188V3.60156L7.09766 2.66406V1.48438C7.09766 0.953125 6.90039 0.476562 6.41406 0.210938L3.01172 -1.52588e-05C2.58008 -0.265631 1.99219 -0.265631 1.56055 -1.52588e-05L-1.80664 0.210938C-2.29297 0.476562 -2.54492 0.953125 -2.54492 1.48438V4.76562C-2.54492 5.29688 -2.34766 5.77344 -1.86133 6.03906L1.54102 8.24219C1.97266 8.50781 2.56055 8.50781 2.99219 8.24219L5.54492 6.73438L7.09766 5.79688L9.60156 4.28906C10.0332 4.02344 10.6211 4.02344 11.0527 4.28906L11.957 4.85156C12.3887 5.11719 12.6406 5.59375 12.6406 6.125V7.19531C12.6406 7.72656 12.4434 8.20312 11.957 8.46875L11.0527 9.03125C10.6211 9.29688 10.0332 9.29688 9.60156 9.03125L8.69727 8.46875C8.26562 8.20312 8.01367 7.72656 8.01367 7.19531V6.01562L6.46094 6.95312V8.13281C6.46094 8.66406 6.6582 9.14062 7.14453 9.40625L10.5469 11.6094C10.9785 11.875 11.5664 11.875 11.998 11.6094L15.4004 9.40625C15.8867 9.14062 16.1387 8.66406 16.1387 8.13281V4.85156C16.1387 4.32031 15.9414 3.84375 15.4551 3.57812L11.2217 4.36621Z" fill="currentColor"/><circle cx="12" cy="3" r="1.5" fill="currentColor"/>',
      width: 17,
      height: 12
    },
    description: 'Polygon zkEVM is a Zero-Knowledge rollup that provides Ethereum Virtual Machine equivalence with the security of cryptographic proofs.'
  },
  {
    id: 'gnosis',
    name: 'Gnosis Chain',
    shortName: 'Gnosis',
    caip2: 'eip155:100',
    colors: {
      light: ['#04795B', '#04795B'],
      dark: ['#04795B', '#04795B'],
      darkTextOnBackground: false
    },
    logo: {
      body: '<path d="M7.5 0C3.35786 0 0 3.35786 0 7.5C0 11.6421 3.35786 15 7.5 15C11.6421 15 15 11.6421 15 7.5C15 3.35786 11.6421 0 7.5 0ZM11.25 7.5C11.25 9.57107 9.57107 11.25 7.5 11.25C5.42893 11.25 3.75 9.57107 3.75 7.5C3.75 5.42893 5.42893 3.75 7.5 3.75C9.57107 3.75 11.25 5.42893 11.25 7.5ZM7.5 2.8125C7.5 2.8125 6.5625 2.8125 6.5625 3.75C6.5625 4.6875 7.5 4.6875 7.5 4.6875C7.5 4.6875 8.4375 4.6875 8.4375 3.75C8.4375 2.8125 7.5 2.8125 7.5 2.8125Z" fill="currentColor"/>',
      width: 15,
      height: 15
    },
    description: 'Gnosis Chain is a stable payment blockchain designed for fast and inexpensive transactions, formerly known as xDAI Chain.'
  },
  {
    id: 'moonbeam',
    name: 'Moonbeam',
    shortName: 'Moonbeam',
    caip2: 'eip155:1284',
    colors: {
      light: ['#53CBC8', '#53CBC8'],
      dark: ['#53CBC8', '#53CBC8'],
      darkTextOnBackground: true
    },
    logo: {
      body: '<path d="M7.5 0C3.35786 0 0 3.35786 0 7.5C0 11.6421 3.35786 15 7.5 15C11.6421 15 15 11.6421 15 7.5C15 3.35786 11.6421 0 7.5 0ZM7.5 12.1875C4.92857 12.1875 2.8125 10.0714 2.8125 7.5C2.8125 4.92857 4.92857 2.8125 7.5 2.8125C10.0714 2.8125 12.1875 4.92857 12.1875 7.5C12.1875 10.0714 10.0714 12.1875 7.5 12.1875ZM7.5 4.6875C6.96429 4.6875 6.5625 5.08929 6.5625 5.625C6.5625 6.16071 6.96429 6.5625 7.5 6.5625C8.03571 6.5625 8.4375 6.16071 8.4375 5.625C8.4375 5.08929 8.03571 4.6875 7.5 4.6875ZM9.84375 7.96875C9.51562 7.96875 9.375 8.0625 9.375 8.0625C9.375 8.0625 9.23438 7.96875 8.90625 7.96875C8.57812 7.96875 8.4375 8.0625 8.4375 8.0625C8.4375 8.0625 8.29688 7.96875 7.96875 7.96875C7.64062 7.96875 7.5 8.0625 7.5 8.0625C7.5 8.0625 7.35938 7.96875 7.03125 7.96875C6.70312 7.96875 6.5625 8.0625 6.5625 8.0625C6.5625 8.0625 6.42188 7.96875 6.09375 7.96875C5.76562 7.96875 5.625 8.0625 5.625 8.0625V9.84375H9.375V8.0625C9.375 8.0625 9.51562 7.96875 9.84375 7.96875Z" fill="currentColor"/>',
      width: 15,
      height: 15
    },
    description: 'Moonbeam is a Polkadot parachain that provides Ethereum compatibility, allowing developers to deploy existing Solidity smart contracts and DApp frontends.'
  },
  {
    id: 'cronos',
    name: 'Cronos',
    shortName: 'Cronos',
    caip2: 'eip155:25',
    colors: {
      light: ['#002D74', '#002D74'],
      dark: ['#0E4FBF', '#0E4FBF'],
      darkTextOnBackground: false
    },
    logo: {
      body: '<path d="M7.5 0L1.875 3.75V11.25L7.5 15L13.125 11.25V3.75L7.5 0ZM11.7188 10.3125L7.5 12.6562L3.28125 10.3125V4.6875L7.5 2.34375L11.7188 4.6875V10.3125ZM7.5 4.21875C6.64062 4.21875 5.9375 4.92188 5.9375 5.78125C5.9375 6.64062 6.64062 7.34375 7.5 7.34375C8.35938 7.34375 9.0625 6.64062 9.0625 5.78125C9.0625 4.92188 8.35938 4.21875 7.5 4.21875ZM10.3125 8.4375H4.6875V9.375H10.3125V8.4375Z" fill="currentColor"/>',
      width: 15,
      height: 15
    },
    description: 'Cronos is the EVM-compatible blockchain built by Crypto.com, designed for DeFi, NFTs, and the metaverse with fast and low-cost transactions.'
  },
  {
    id: 'aurora',
    name: 'Aurora',
    shortName: 'Aurora',
    caip2: 'eip155:1313161554',
    colors: {
      light: ['#70D44B', '#70D44B'],
      dark: ['#70D44B', '#70D44B'],
      darkTextOnBackground: true
    },
    logo: {
      body: '<path d="M7.5 0C3.35786 0 0 3.35786 0 7.5C0 11.6421 3.35786 15 7.5 15C11.6421 15 15 11.6421 15 7.5C15 3.35786 11.6421 0 7.5 0ZM7.5 1.875C10.6071 1.875 13.125 4.39286 13.125 7.5C13.125 10.6071 10.6071 13.125 7.5 13.125C4.39286 13.125 1.875 10.6071 1.875 7.5C1.875 4.39286 4.39286 1.875 7.5 1.875ZM5.625 4.6875L3.75 7.5L5.625 10.3125H9.375L11.25 7.5L9.375 4.6875H5.625ZM7.5 5.625C8.03571 5.625 8.4375 6.02679 8.4375 6.5625C8.4375 7.09821 8.03571 7.5 7.5 7.5C6.96429 7.5 6.5625 7.09821 6.5625 6.5625C6.5625 6.02679 6.96429 5.625 7.5 5.625Z" fill="currentColor"/>',
      width: 15,
      height: 15
    },
    description: 'Aurora is an Ethereum Virtual Machine created by the team at the NEAR Protocol, delivering a turn-key solution for developers to operate their apps on an Ethereum-compatible, high-throughput, scalable and future-safe platform.'
  },
  {
    id: 'zircuit',
    name: 'Zircuit',
    shortName: 'Zircuit',
    caip2: 'eip155:48900',
    colors: {
      light: ['#4A90E2', '#4A90E2'],
      dark: ['#4A90E2', '#4A90E2'],
      darkTextOnBackground: false
    },
    logo: {
      body: '<path d="M7.5 0L0 5.625V9.375L7.5 15L15 9.375V5.625L7.5 0ZM11.25 8.4375L7.5 11.25L3.75 8.4375V6.5625L7.5 3.75L11.25 6.5625V8.4375Z" fill="currentColor"/>',
      width: 15,
      height: 15
    },
    description: 'Zircuit is a Layer 2 solution designed to scale Ethereum by providing lower transaction fees and faster confirmation times while maintaining security.'
  },
  {
    id: 'starknet',
    name: 'Starknet',
    shortName: 'Starknet',
    caip2: 'starknet:SN_MAIN',
    colors: {
      light: ['#EC796B', '#EC796B'],
      dark: ['#EC796B', '#EC796B'],
      darkTextOnBackground: false
    },
    logo: {
      body: '<path d="M7.48 0.28C7.22 0.28 6.97 0.38 6.77 0.57L0.57 6.77C0.20 7.14 0.20 7.75 0.57 8.12L6.77 14.32C6.97 14.51 7.22 14.61 7.48 14.61C7.74 14.61 7.99 14.51 8.19 14.32L14.39 8.12C14.76 7.75 14.76 7.14 14.39 6.77L8.19 0.57C7.99 0.38 7.74 0.28 7.48 0.28ZM7.48 2.36L12.31 7.19H10.64L8.26 4.81C8.07 4.62 7.89 4.62 7.70 4.81L5.32 7.19H3.65L7.48 2.36ZM7.48 12.53L3.65 7.70H5.32L7.70 10.08C7.89 10.27 8.07 10.27 8.26 10.08L10.64 7.70H12.31L7.48 12.53Z" fill="currentColor"/>',
      width: 15,
      height: 15
    },
    description: 'Starknet is a permissionless Layer 2 ZK-rollup that operates as a validity-rollup, using STARK proofs and the Cairo programming language.'
  },
  {
    id: 'soneium',
    name: 'Soneium',
    shortName: 'Soneium',
    caip2: 'eip155:1868',
    colors: {
      light: ['#6366F1', '#6366F1'],
      dark: ['#818CF8', '#818CF8'],
      darkTextOnBackground: false
    },
    logo: {
      body: '<circle cx="7.5" cy="7.5" r="6" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="7.5" cy="7.5" r="2" fill="currentColor"/>',
      width: 15,
      height: 15
    },
    description: 'Soneium is an Ethereum Layer 2 blockchain network that provides scalable and efficient transaction processing with ETH as its native currency.'
  },
  {
    id: 'megaeth_testnet_v2',
    name: '🐰 MegaETH Testnet v2',
    shortName: 'Timothy',
    caip2: 'eip155:6343',
    chainId: 6343,
    colors: {
      light: ['#6366F1', '#818CF8'],
      dark: ['#818CF8', '#A5B4FC'],
      darkTextOnBackground: false
    },
    logo: null,
    description: 'MegaETH Testnet v2 - Featured promotional testnet for MegaETH',
    isTestnet: true
  },
  {
    id: 'megaeth',
    name: '🐰 MegaETH',
    shortName: 'MegaETH',
    caip2: 'eip155:4326',
    chainId: 4326,
    colors: {
      light: ['#0EA5E9', '#38BDF8'],
      dark: ['#0EA5E9', '#38BDF8'],
      darkTextOnBackground: false
    },
    logo: null,
    description: 'MegaETH mainnet.'
  },
  {
    id: 'megaeth_testnet',
    name: '🐰 MegaETH Testnet v1',
    shortName: 'Carrot',
    caip2: 'eip155:6342',
    chainId: 6342,
    colors: {
      light: ['#6366F1', '#818CF8'],
      dark: ['#818CF8', '#A5B4FC'],
      darkTextOnBackground: false
    },
    logo: null,
    description: 'MegaETH Testnet V1 - Featured promotional testnet for MegaETH',
    isTestnet: true
  },
  {
    id: 'any',
    name: 'Any EVM Chain',
    shortName: 'Any EVM Chain',
    caip2: 'eip155:any',
    colors: {
      light: ['#6B7280', '#9CA3AF'],
      dark: ['#9CA3AF', '#D1D5DB'],
      darkTextOnBackground: false
    },
    logo: null,
    description: 'Tag applied to indicate that the attestation is not specific to a single chain but is applicable to all EVM chains.'
  },
];

// Import dynamically generated Orbit chains
// Using a function to handle the optional import
function loadOrbitChains(): ChainMetadata[] {
  try {
    // Try to import the auto-generated file
    // This will be available after running npm run sync-orbit-chains
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const orbitModule = require('./orbitChains');
    return orbitModule.ORBIT_CHAINS || [];
  } catch {
    // orbitChains.ts doesn't exist yet - this is fine
    // It will be generated by the fetch-orbit-chains script
    if (process.env.NODE_ENV === 'development') {
      console.warn('Orbit chains not yet loaded. Run: npm run sync-orbit-chains');
    }
    return [];
  }
}

const orbitChains = loadOrbitChains();

// Merge base chains with dynamically fetched Orbit chains
// Filter out duplicates based on caip2 (keeping BASE_CHAINS version if conflict)
const baseChainIds = new Set(BASE_CHAINS.map(c => c.caip2));
const uniqueOrbitChains = orbitChains.filter(chain => !baseChainIds.has(chain.caip2));

// Basic heuristic to identify testnets by name/id
const isTestnetChain = (chain: ChainMetadata) => {
  return !!chain.isTestnet;
};

const combinedChains = [...BASE_CHAINS, ...uniqueOrbitChains];
const mainnetChains = combinedChains.filter(chain => !isTestnetChain(chain));
const testnetChains = combinedChains.filter(chain => isTestnetChain(chain));

export const CHAINS: ChainMetadata[] = [...mainnetChains, ...testnetChains];

export type Chain = typeof CHAINS[number]['id'];

export const CHAIN_OPTIONS = CHAINS.map(chain => ({
  value: chain.caip2,
  label: chain.name,
  isOrbitChain: chain.isOrbitChain || false,
  group: isTestnetChain(chain) ? 'Testnets' : 'Mainnets',
  isTestnet: isTestnetChain(chain)
}));

// Helper function to check if a chain is an Orbit chain
export function isOrbitChain(caip2: string): boolean {
  const chain = CHAINS.find(c => c.caip2 === caip2);
  return chain?.isOrbitChain || false;
}

// Helper function to get Orbit chain metadata
export function getOrbitChainMetadata(caip2: string) {
  const chain = CHAINS.find(c => c.caip2 === caip2);
  return chain?.orbitMetadata;
}
