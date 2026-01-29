#!/usr/bin/env node

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// Calculate discriminator for "account:DynamicTickArray"
// Anchor uses sha256("account:AccountName") and takes first 8 bytes
function getDiscriminator(accountName) {
  const hash = crypto.createHash('sha256');
  hash.update(`account:${accountName}`);
  const digest = hash.digest();
  return Array.from(digest.slice(0, 8));
}

// Read the IDL file
const idlPath = path.join(__dirname, '..', 'target', 'idl', 'amm_v3.json');
const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));

// Check if DynamicTickArray already exists
const existingAccount = idl.accounts?.find(acc => acc.name === 'DynamicTickArray');
if (existingAccount) {
  console.log('DynamicTickArray already exists in IDL');
  process.exit(0);
}

// Create the account definition
const dynamicTickArrayAccount = {
  name: 'DynamicTickArray',
  discriminator: getDiscriminator('DynamicTickArray')
};

// Add to accounts array
if (!idl.accounts) {
  idl.accounts = [];
}
idl.accounts.push(dynamicTickArrayAccount);

// Write back to file
fs.writeFileSync(idlPath, JSON.stringify(idl, null, 2));
console.log('✅ Added DynamicTickArray to IDL');

// Also update the SDK IDL if it exists
const sdkIdlPath = path.join(__dirname, '..', 'sdk', 'idl', 'stabble_clmm.json');
if (fs.existsSync(sdkIdlPath)) {
  const sdkIdl = JSON.parse(fs.readFileSync(sdkIdlPath, 'utf8'));
  const existingSdkAccount = sdkIdl.accounts?.find(acc => acc.name === 'DynamicTickArray');
  if (!existingSdkAccount) {
    if (!sdkIdl.accounts) {
      sdkIdl.accounts = [];
    }
    sdkIdl.accounts.push(dynamicTickArrayAccount);
    fs.writeFileSync(sdkIdlPath, JSON.stringify(sdkIdl, null, 2));
    console.log('✅ Added DynamicTickArray to SDK IDL');
  }
}
