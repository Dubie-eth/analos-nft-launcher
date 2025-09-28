import { WalletAdapter, WalletAdapterNetwork, WalletName, WalletReadyState } from '@solana/wallet-adapter-base';
import { PublicKey, Transaction } from '@solana/web3.js';

export interface BackpackWallet {
  isBackpack?: boolean;
  publicKey?: PublicKey;
  isConnected: boolean;
  connect(): Promise<{ publicKey: PublicKey }>;
  disconnect(): Promise<void>;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
}

export class BackpackWalletAdapter implements WalletAdapter {
  private _publicKey: PublicKey | null = null;
  private _connected = false;
  private _connecting = false;
  private _readyState: WalletReadyState = WalletReadyState.NotDetected;

  constructor() {
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.signTransaction = this.signTransaction.bind(this);
    this.signAllTransactions = this.signAllTransactions.bind(this);
    this.signMessage = this.signMessage.bind(this);
  }

  get publicKey(): PublicKey | null {
    return this._publicKey;
  }

  get connected(): boolean {
    return this._connected;
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get ready(): boolean {
    return typeof window !== 'undefined' && !!window.backpack;
  }

  get readyState(): WalletReadyState {
    return this._readyState;
  }

  async autoConnect(): Promise<void> {
    // Auto-connect functionality - can be implemented later if needed
    return Promise.resolve();
  }

  get name(): WalletName {
    return 'Backpack' as WalletName;
  }

  get url(): string {
    return 'https://backpack.app';
  }

  get icon(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzAwMDAwMCIvPgo8cGF0aCBkPSJNOCAxMkgxNlYyMEg4VjEyWiIgZmlsbD0iI0ZGRkZGRiIvPgo8cGF0aCBkPSJNMTYgMTJIMjRWMjBIMTZWMTJaIiBmaWxsPSIjRkZGRkZGIi8+Cjwvc3ZnPgo=';
  }

  async connect(): Promise<void> {
    if (this._connected || this._connecting) return;

    this._connecting = true;

    try {
      if (!this.ready) {
        throw new Error('Backpack wallet not found. Please install the Backpack extension.');
      }

      const wallet = window.backpack as BackpackWallet;
      const response = await wallet.connect();
      
      this._publicKey = response.publicKey;
      this._connected = true;

    } catch (error) {
      throw error;
    } finally {
      this._connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (!this._connected) return;

    try {
      if (this.ready) {
        const wallet = window.backpack as BackpackWallet;
        await wallet.disconnect();
      }
    } catch (error) {
      throw error;
    } finally {
      this._publicKey = null;
      this._connected = false;
    }
  }

  async sendTransaction(transaction: Transaction, connection: any, options?: any): Promise<string> {
    if (!this._connected || !this.ready) {
      throw new Error('Wallet not connected');
    }

    try {
      const wallet = window.backpack as BackpackWallet;
      const signedTransaction = await wallet.signTransaction(transaction);
      return connection.sendRawTransaction(signedTransaction.serialize(), options);
    } catch (error) {
      throw error;
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this._connected || !this.ready) {
      throw new Error('Wallet not connected');
    }

    try {
      const wallet = window.backpack as BackpackWallet;
      return await wallet.signTransaction(transaction);
    } catch (error) {
      throw error;
    }
  }

  async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    if (!this._connected || !this.ready) {
      throw new Error('Wallet not connected');
    }

    try {
      const wallet = window.backpack as BackpackWallet;
      return await wallet.signAllTransactions(transactions);
    } catch (error) {
      throw error;
    }
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    if (!this._connected || !this.ready) {
      throw new Error('Wallet not connected');
    }

    try {
      const wallet = window.backpack as BackpackWallet;
      return await wallet.signMessage(message);
    } catch (error) {
      throw error;
    }
  }

  // Simple event emitter - just basic functionality
  on(event: string, callback?: Function, context?: any): this {
    // Basic implementation - can be enhanced later if needed
    return this;
  }

  off(event: string, callback?: Function, context?: any, once?: boolean): this {
    // Basic implementation - can be enhanced later if needed
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    // Basic implementation - can be enhanced later if needed
    return true;
  }
}

// Extend the Window interface to include backpack
declare global {
  interface Window {
    backpack?: BackpackWallet;
  }
}