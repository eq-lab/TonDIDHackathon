import { AccountsDictionary, AccountState } from '@kyc/contracts/dist/common/index.js';
import { decodeDomainName } from '@kyc/contracts/dist/common/index.js';

export function stateToString(state: AccountState): string {
    switch (state) {
        case AccountState.Unknown:
            return 'Unknown';
        case AccountState.Requested:
            return 'Requested';
        case AccountState.Approved:
            return 'Approved';
        case AccountState.Declined:
            return 'Declined';
    }
}

export function reduceAddress(address: string): string {
    const length = address.length;
    if (length < 10) {
        return address;
    }
    return address.slice(0, 5) + '...' + address.slice(length - 5);
}

export function filterAccByState(dict: AccountsDictionary, state: AccountState): string[] {
    const filtered: string[] = [];
    // @ts-ignore
    for (const [acc, accState] of dict) {
        if (accState === state) {
            filtered.push(decodeDomainName(acc) + '.ton');
        }
    }
    return filtered;
}
