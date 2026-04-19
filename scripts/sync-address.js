#!/usr/bin/env node
// Reads the latest deployment address from Foundry's broadcast and updates dapp/.env.local

const fs = require('fs');
const path = require('path');

const broadcastPath = path.join(__dirname, '../broadcast/Deploy.s.sol/31337/run-latest.json');
const envPath = path.join(__dirname, '../dapp/.env.local');

if (!fs.existsSync(broadcastPath)) {
  console.error('No broadcast file found. Run the deploy script first.');
  process.exit(1);
}

const broadcast = JSON.parse(fs.readFileSync(broadcastPath, 'utf8'));
const contractAddress = broadcast.receipts?.[0]?.contractAddress;

if (!contractAddress) {
  console.error('No contract address found in broadcast file.');
  process.exit(1);
}

// Checksum the address (capitalize correctly)
const checksummed = contractAddress.slice(0, 2) +
  contractAddress.slice(2).replace(/./g, (c, i, s) => {
    const hash = require('crypto').createHash('sha3-256' in require('crypto').getHashes() ? 'sha3-256' : 'sha256').update(s.toLowerCase()).digest('hex');
    return parseInt(hash[i], 16) >= 8 ? c.toUpperCase() : c.toLowerCase();
  });

let env = fs.readFileSync(envPath, 'utf8');
env = env.replace(/NEXT_PUBLIC_CONTRACT_ADDRESS=.*/,
  `NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
fs.writeFileSync(envPath, env);

console.log(`✅ Contract address updated to: ${contractAddress}`);
