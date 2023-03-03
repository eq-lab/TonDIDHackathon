import { Address, Cell, TonClient, WalletContractV4 } from 'ton';
import { mnemonicToPrivateKey } from 'ton-crypto/dist/mnemonic/mnemonic';

import { KeyPair } from 'ton-crypto';
import { Dictionary } from 'ton-core';
import { Config, getHttpEndpoint } from '@orbs-network/ton-access';
import { Kyc } from '@kyc/contracts/kyc';

export enum AccountState {
    Unknown = 0,
    Requested = 1,
    Approved = 2,
    Declined = 3,
}

export enum ExitCodes {
    WrongSeqno = 70,
    WrongSignature = 71,
    IncorrectFees = 72,
    AccountAlreadyExisted = 73,
}

export const DnsMaxLengthBytes = 126;

export const AccountsDictionaryKey = Dictionary.Keys.Buffer(DnsMaxLengthBytes);
export const AccountsDictionaryValue = Dictionary.Values.Uint(2);
export type AccountsDictionary = Dictionary<Buffer, number>;

export interface ContractInfo {
    name: string;
    address: string;
    workchain: number;
}

export interface Deployment {
    getContractWithName: (name: string) => ContractInfo | undefined;
    getContractWithAddress: (address: string) => ContractInfo | undefined;
    pushContract: (info: ContractInfo) => void;
}

export async function createTonClient(config: Config): Promise<TonClient> {
    const endpoint = await getHttpEndpoint({ network: 'testnet' });
    return new TonClient({ endpoint });
}

export async function createWalletContract(client: TonClient, key: KeyPair): Promise<WalletContractV4> {
    // open wallet v4 (notice the correct wallet version here)
    const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
    if (!(await client.isContractDeployed(wallet.address))) {
        throw 'createWallet: wallet is not deployed';
    }
    return wallet;
}

export function createKycContract(contractAddress: string): Kyc {
    const counterAddress = Address.parse(contractAddress); // replace with your address from step 8
    return new Kyc(counterAddress);
}

export function createAccountsDictionary(initialStates?: [string, number][]): AccountsDictionary {
    const dict = Dictionary.empty(AccountsDictionaryKey, AccountsDictionaryValue);
    if (initialStates !== undefined) {
        for (const [account, state] of initialStates) {
            dict.set(encodeDomainName(account), state);
        }
    }
    return dict;
}

export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function convertNumToGram(num: number): bigint {
    return BigInt(num * 1000000000);
}

export function convertGramToNum(gram: bigint): number {
    return Number(gram) / 1000000000;
}

export function encodeDomainName(name: string): Buffer {
    if (!name.endsWith('.ton')) {
        throw `domain name must contains .ton!`;
    }
    const buffer = Buffer.from(name, 'utf8');
    const filler = Buffer.alloc(DnsMaxLengthBytes - buffer.length, 0);
    return Buffer.concat([filler, buffer]);
}

export function decodeDomainName(encodedName: Buffer): string {
    const startIndex = encodedName.findIndex((byte) => byte !== 0);
    return encodedName.subarray(startIndex).toString('utf8');
}

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
