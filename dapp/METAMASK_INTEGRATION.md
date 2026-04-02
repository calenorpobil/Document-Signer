# MetaMask SDK Integration Guide

## Overview

This dApp now supports **two wallet connection methods**:

1. **Anvil Test Wallets** - For local development (no MetaMask required)
2. **MetaMask SDK** - For production use with real MetaMask wallet (extension or mobile)

## Features

### Dual Wallet Support
- **Anvil Wallets**: 10 pre-configured test wallets for development
- **MetaMask**: Real wallet connection via MetaMask SDK
  - Browser extension support
  - MetaMask Mobile support (QR code)
  - Automatic reconnection

### Smart Wallet Selection
The wallet selector provides an intuitive interface:
- Choose between MetaMask or Anvil wallets
- See which wallet type is currently connected
- Easy switching between wallets
- Clear visual indicators

## Setup Instructions

### 1. Prerequisites

Make sure you have:
- Node.js 18+ installed
- Anvil (for local development)
- MetaMask browser extension (for MetaMask connection)

### 2. Installation

```bash
# Install dependencies
cd dapp
npm install

# The following package was added for MetaMask SDK support:
# @metamask/sdk (included with @metamask/sdk-react)
```

### 3. Environment Configuration

The `.env.local` file is already configured:

```env
# Contract Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337

# MetaMask SDK Configuration
NEXT_PUBLIC_METAMASK_SDK_CHAIN_ID=31337
NEXT_PUBLIC_METAMASK_SDK_RPC_URL=http://localhost:8545
```

### 4. Start Development Server

```bash
# Terminal 1: Start Anvil
anvil

# Terminal 2: Start dApp
cd dapp
npm run dev
```

The dApp will be available at `http://localhost:3000`

## Usage

### Connecting a Wallet

1. Click the **"Connect Wallet"** button in the top right
2. Choose your preferred wallet type:
   - **MetaMask**: For real wallet connection
   - **Anvil Test Wallets**: For local development

#### MetaMask Connection
- If you have MetaMask extension installed, it will automatically detect it
- Click "Connect" in the MetaMask popup
- You're connected!

#### Anvil Wallet Connection
- Select "Anvil Test Wallets"
- Choose one of the 10 available test wallets
- Each wallet comes pre-funded with 10,000 ETH on Anvil

### Switching Between Wallets

While connected, click the wallet button to see:
- Current wallet address and type
- Option to switch to a different Anvil wallet
- Option to disconnect

### Signing Documents

1. **Connect your wallet** (MetaMask or Anvil)
2. **Upload a document** (PDF, image, etc.)
3. **Click "Sign Document"**
   - A confirmation dialog will show the hash and timestamp
   - Approve the signature in your wallet
4. **Click "Store on Blockchain"**
   - Review the transaction details
   - Confirm the transaction
5. **Done!** Your document is now stored on the blockchain

### Verifying Documents

1. Go to the **"Verify"** tab
2. **Upload the original document**
3. **Enter the signer's address**
4. **Click "Verify Document"**
5. The system will verify the signature and show the result

## Technical Implementation

### MetaMask SDK Configuration

The SDK is initialized in `contexts/MetaMaskContext.tsx`:

```typescript
const getMetaMaskSDK = () => {
  if (!metamaskSDK) {
    metamaskSDK = new MetaMaskSDK({
      dappMetadata: {
        name: 'Document Signer dApp',
        url: window.location.origin,
      },
      extensionOnly: false, // Allow mobile connection
      checkInstallationImmediately: false,
    });
  }
  return metamaskSDK;
};
```

### Wallet State Management

The context manages:
- `walletType`: 'anvil' | 'metamask' | null
- `account`: Current wallet address
- `provider`: Ethers provider (JsonRpcProvider for Anvil, BrowserProvider for MetaMask)
- `signer`: Ethers signer for transactions
- `isConnected`: Connection status

### Key Functions

```typescript
// Connect to Anvil wallet
await connect(index: number)

// Connect to MetaMask
await connectMetaMask()

// Sign a message (works with both wallet types)
await signMessage(message: string | Uint8Array)

// Switch between wallets
await switchToAnvil(index: number)
await switchToMetaMask()

// Disconnect
disconnect()
```

## Troubleshooting

### MetaMask Connection Issues

**Problem**: MetaMask popup doesn't appear
- **Solution**: Make sure MetaMask extension is installed and unlocked

**Problem**: "MetaMask connection failed" error
- **Solution**: 
  1. Refresh the page
  2. Make sure MetaMask is unlocked
  3. Check browser console for errors

**Problem**: Can't connect to local Anvil network
- **Solution**: Add Anvil network to MetaMask manually:
  - Network Name: Anvil Local
  - RPC URL: http://localhost:8545
  - Chain ID: 31337
  - Currency Symbol: ETH

### Anvil Wallet Issues

**Problem**: "Could not connect to Anvil" warning
- **Solution**: Make sure Anvil is running on http://localhost:8545

**Problem**: Transactions fail
- **Solution**: 
  1. Check Anvil is running
  2. Verify contract is deployed to the correct address
  3. Check .env.local has correct contract address

## Architecture

### File Structure

```
dapp/
├── contexts/
│   └── MetaMaskContext.tsx    # Wallet management (Anvil + MetaMask)
├── components/
│   ├── WalletSelector.tsx     # Wallet connection UI
│   ├── DocumentSigner.tsx     # Document signing component
│   └── ...
├── hooks/
│   └── useContract.ts         # Contract interaction
├── app/
│   ├── providers.tsx          # App providers setup
│   └── layout.tsx             # Root layout with providers
└── .env.local                 # Environment configuration
```

### Dependencies

```json
{
  "@metamask/sdk": "^0.33.1",
  "ethers": "^6.16.0",
  "next": "14.2.18",
  "react": "18.3.1",
  "react-dom": "18.3.1"
}
```

## Security Notes

⚠️ **Important Security Considerations**:

1. **Development Only**: This implementation uses hardcoded Anvil private keys for development. **NEVER use this in production**.

2. **MetaMask SDK**: The MetaMask integration is production-ready and doesn't expose private keys.

3. **Local Network**: The SDK is configured to connect to Anvil local network (chain ID 31337). For production, update the configuration to use a public network.

4. **Private Keys**: Anvil private keys are only used for local development. MetaMask users never expose their private keys.

## Next Steps

To deploy to production:

1. **Update Network Configuration**:
   ```typescript
   // In MetaMaskContext.tsx
   const getMetaMaskSDK = () => {
     if (!metamaskSDK) {
       metamaskSDK = new MetaMaskSDK({
         defaultChainId: 1, // Ethereum Mainnet
         // or 11155111 for Sepolia testnet
         dappMetadata: {
           name: 'Document Signer dApp',
           url: window.location.origin,
         },
       });
     }
     return metamaskSDK;
   };
   ```

2. **Deploy Contract**: Deploy DocumentRegistry.sol to your target network

3. **Update Environment Variables**:
   ```env
   NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedContractAddress
   NEXT_PUBLIC_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
   NEXT_PUBLIC_CHAIN_ID=1
   ```

4. **Remove Anvil Wallets**: For production, remove the Anvil wallet option or make it development-only

## Resources

- [MetaMask SDK Documentation](https://docs.metamask.io/wallet/how-to/connect/set-up-sdk/javascript/react/)
- [Ethers.js Documentation](https://docs.ethers.org/v6/)
- [Next.js Documentation](https://nextjs.org/docs)

## Support

For issues or questions:
1. Check the console for error messages
2. Verify Anvil is running (for local development)
3. Ensure MetaMask is unlocked (for MetaMask connection)
4. Review this guide's troubleshooting section