// Bridge between CommonJS backend and ES module Analos SDKs
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class AnalosSDKBridge {
  constructor(connection, walletKeypair) {
    this.connection = connection;
    this.walletKeypair = walletKeypair;
  }

  async createNFTCollection(collectionData) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, 'analos-sdk-runner.mjs');
      const args = [
        scriptPath,
        'createCollection',
        JSON.stringify({
          connection: {
            endpoint: this.connection.rpcEndpoint
          },
          wallet: {
            publicKey: this.walletKeypair.publicKey.toBase58(),
            secretKey: Array.from(this.walletKeypair.secretKey)
          },
          collectionData
        })
      ];

      const child = spawn('node', args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse result: ${error.message}`));
          }
        } else {
          reject(new Error(`Process exited with code ${code}: ${errorOutput}`));
        }
      });
    });
  }

  async mintNFTs(poolAddress, quantity, userWallet) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, 'analos-sdk-runner.mjs');
      const args = [
        scriptPath,
        'mintNFTs',
        JSON.stringify({
          connection: {
            endpoint: this.connection.rpcEndpoint
          },
          wallet: {
            publicKey: this.walletKeypair.publicKey.toBase58(),
            secretKey: Array.from(this.walletKeypair.secretKey)
          },
          poolAddress,
          quantity,
          userWallet
        })
      ];

      const child = spawn('node', args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse result: ${error.message}`));
          }
        } else {
          reject(new Error(`Process exited with code ${code}: ${errorOutput}`));
        }
      });
    });
  }

  async getCollectionInfo(poolAddress) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, 'analos-sdk-runner.mjs');
      const args = [
        scriptPath,
        'getCollectionInfo',
        JSON.stringify({
          connection: {
            endpoint: this.connection.rpcEndpoint
          },
          wallet: {
            publicKey: this.walletKeypair.publicKey.toBase58(),
            secretKey: Array.from(this.walletKeypair.secretKey)
          },
          poolAddress
        })
      ];

      const child = spawn('node', args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse result: ${error.message}`));
          }
        } else {
          reject(new Error(`Process exited with code ${code}: ${errorOutput}`));
        }
      });
    });
  }
}

module.exports = { AnalosSDKBridge };
