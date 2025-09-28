import { WalletAdapter, WalletAdapterNetwork, WalletName } from '@solana/wallet-adapter-base';
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
  on?(event: string, callback: Function): void;
  off?(event: string, callback: Function): void;
}

export class BackpackWalletAdapter implements WalletAdapter {
  private _publicKey: PublicKey | null = null;
  private _connected = false;
  private _connecting = false;

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

      // Listen for account changes (if wallet supports events)
      if (wallet.on) {
        wallet.on('accountChanged', (publicKey: PublicKey | null) => {
          this._publicKey = publicKey;
          this._connected = !!publicKey;
          this.emit('connect');
        });

        wallet.on('disconnect', () => {
          this._publicKey = null;
          this._connected = false;
          this.emit('disconnect');
        });
      }

    } catch (error) {
      this.emit('error', error);
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
      this.emit('error', error);
      throw error;
    } finally {
      this._publicKey = null;
      this._connected = false;
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
      this.emit('error', error);
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
      this.emit('error', error);
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
      this.emit('error', error);
      throw error;
    }
  }

  // Event emitter functionality
  private listeners: { [key: string]: Function[] } = {};

  on(event: string, callback: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  private emit(event: string, ...args: any[]): void {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(...args));
  }
}

// Extend the Window interface to include backpack
declare global {
  interface Window {
    backpack?: BackpackWallet;
  }
}
