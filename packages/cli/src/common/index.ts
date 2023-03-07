import path from 'path';
import { AccountState } from '@kyc/contracts/dist/common/index.js';

export const kycContractFileName = `..${path.sep}contracts${path.sep}bin${path.sep}kyc.cell`;
export const deploymentPath = `..${path.sep}contracts${path.sep}data${path.sep}deployment.json`;

export function parseAccountState(str: string): AccountState | undefined {
    switch (str.toLowerCase()) {
        case 'unknown':
            return AccountState.Unknown;
        case 'requested':
            return AccountState.Requested;
        case 'approved':
            return AccountState.Approved;
        case 'declined':
            return AccountState.Declined;
        default:
            return undefined;
    }
}
