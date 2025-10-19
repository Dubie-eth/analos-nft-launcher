/**
 * Type definitions for Analos Monitoring System IDL
 */

import { Idl } from '@coral-xyz/anchor';

export type AnalosMonitoringSystem = Idl & {
  version: '0.1.0';
  name: 'analos_monitoring_system';
  instructions: any[];
  accounts: any[];
  types: any[];
  events: any[];
  errors: any[];
};

declare const IDL: AnalosMonitoringSystem;
export default IDL;

