# ETH Database Document dApp

A decentralized application for document signing and verification using Ethereum blockchain.

## Features

- **Document Signing**: Upload documents, calculate cryptographic hashes, and sign them using Anvil test wallets
- **Document Verification**: Verify document authenticity by checking signatures against blockchain records
- **No MetaMask Required**: Uses Anvil's built-in wallets for development (no browser extension needed)
- **Decentralized Storage**: Document hashes are stored immutably on the blockchain
- **User-Friendly Interface**: Clean, intuitive UI built with Next.js and Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 16+ with TypeScript
- **Styling**: Tailwind CSS
- **Web3**: Ethers.js v6
- **Icons**: Lucide React
- **State Management**: React Context API

## Prerequisites

- Node.js 18+
- Anvil (from Foundry) running locally
- Deployed DocumentRegistry smart contract

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env.local`:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337
```

## Development

1. Start Anvil (Terminal 1):
```bash
anvil
```

2. Deploy the smart contract (Terminal 2):
```bash
cd ..
forge build
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

3. Start the dApp (Terminal 3):
```bash
cd dapp
npm run dev
```

4. Open browser to `http://localhost:3000`

## Usage

### Sign a Document

1. Click "Connect Wallet" and select one of the 10 Anvil test wallets
2. Go to the "Sign Document" tab
3. Upload your document file
4. The system will calculate the keccak256 hash automatically
5. Click "Sign Document" and confirm the signature
6. Click "Store on Blockchain" to store the document hash
7. Transaction hash will be displayed upon success

### Verify a Document

1. Go to the "Verify Document" tab
2. Upload the original document
3. Enter the signer's Ethereum address
4. Click "Verify Document"
5. The system will check if the document exists on blockchain and verify the signature

## Project Structure

```
dapp/
├── app/
│   ├── page.tsx              # Main page with tabs
│   ├── layout.tsx            # Root layout
│   ├── providers.tsx         # Context providers
│   └── globals.css           # Global styles
├── components/
│   ├── FileUploader.tsx      # File upload with drag & drop
│   ├── DocumentSigner.tsx    # Document signing workflow
│   ├── DocumentVerifier.tsx  # Document verification tool
│   └── WalletSelector.tsx    # Wallet connection dropdown
├── contexts/
│   └── MetaMaskContext.tsx   # Global wallet state
├── hooks/
│   ├── useContract.ts        # Contract interaction
│   └── useFileHash.ts        # File hashing utility
├── .env.local                # Environment variables
└── package.json              # Dependencies
```

## Key Components

### MetaMaskContext
Provides global wallet state management using React Context API. Handles connection to Anvil's test wallets and message signing.

### useContract Hook
Custom hook for interacting with the DocumentRegistry smart contract. Provides methods for:
- `storeDocument`: Store document hash on blockchain
- `verifyDocument`: Verify document authenticity
- `getDocumentInfo`: Retrieve document information
- `isDocumentStored`: Check if document exists

### useFileHash Hook
Custom hook for calculating keccak256 hash of files using Ethers.js.

## Important Notes

- **Development Only**: This dApp is designed for local development with Anvil
- **Private Keys**: Private keys are hardcoded for development purposes only
- **No Production Use**: Do NOT use this configuration on mainnet or production networks
- **Anvil Required**: The dApp requires Anvil to be running on `http://localhost:8545`

## Troubleshooting

### Cannot connect to wallet
Make sure Anvil is running: `anvil`

### Contract not found
Update `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env.local` with the deployed contract address

### Transaction fails
Ensure you have sufficient ETH in the selected wallet (Anvil provides 10,000 ETH per wallet by default)

## License

MIT