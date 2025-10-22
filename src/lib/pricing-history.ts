import fs from 'fs/promises';
import path from 'path';
import { PricingConfig } from './pricing-config-utils';

export interface PricingChange {
  id: string;
  timestamp: string; // ISO string
  config: PricingConfig;
  changedBy?: string;
}

function historyFilePath(): string {
  const dataDir = path.join(process.cwd(), 'data');
  return path.join(dataDir, 'pricing_history.json');
}

async function ensureHistoryFile(): Promise<void> {
  const file = historyFilePath();
  try {
    await fs.access(file);
  } catch {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify([], null, 2));
  }
}

export async function readPricingHistory(): Promise<PricingChange[]> {
  await ensureHistoryFile();
  const raw = await fs.readFile(historyFilePath(), 'utf8');
  try {
    const parsed = JSON.parse(raw) as PricingChange[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function recordPricingChange(config: PricingConfig, changedBy?: string): Promise<PricingChange> {
  const entry: PricingChange = {
    id: cryptoRandomId(),
    timestamp: new Date().toISOString(),
    config,
    changedBy,
  };
  const history = await readPricingHistory();
  history.push(entry);
  await fs.writeFile(historyFilePath(), JSON.stringify(history, null, 2));
  return entry;
}

export async function getPricingAnalytics(): Promise<{
  totalChanges: number;
  lastChangeAt?: string;
  tiers: Record<string, { latest: number; min: number; max: number; avg: number }>;
  changesByDay: Record<string, number>;
}> {
  const history = await readPricingHistory();
  const totalChanges = history.length;
  const lastChangeAt = history[totalChanges - 1]?.timestamp;

  const tierKeys = ['tier5Plus', 'tier4', 'tier3', 'tier2', 'tier1'] as const;
  const tiers: Record<string, { latest: number; min: number; max: number; avg: number }> = {};
  const valuesByTier: Record<string, number[]> = {};
  tierKeys.forEach((k) => (valuesByTier[k] = []));

  for (const h of history) {
    tierKeys.forEach((k) => {
      const val = h.config.pricingTiers[k];
      if (typeof val === 'number') valuesByTier[k].push(val);
    });
  }

  tierKeys.forEach((k) => {
    const vals = valuesByTier[k];
    const latest = history.length > 0 ? history[history.length - 1].config.pricingTiers[k] : 0;
    const min = vals.length ? Math.min(...vals) : 0;
    const max = vals.length ? Math.max(...vals) : 0;
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    tiers[k] = { latest, min, max, avg };
  });

  const changesByDay: Record<string, number> = {};
  for (const h of history) {
    const day = h.timestamp.slice(0, 10);
    changesByDay[day] = (changesByDay[day] || 0) + 1;
  }

  return { totalChanges, lastChangeAt, tiers, changesByDay };
}

function cryptoRandomId(): string {
  // Lightweight random id without importing crypto in edge runtimes
  return 'ph_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}
