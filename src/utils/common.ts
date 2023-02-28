import { Address, Cell, TonClient, WalletContractV4 } from 'ton';
import * as fs from 'fs';
import path from 'path';
import { mnemonicToPrivateKey } from 'ton-crypto/dist/mnemonic/mnemonic';
import { Kyc } from '../kyc';
import { KeyPair, mnemonicToWalletKey } from 'ton-crypto';
import { beginCell, Contract, Dictionary, Sender } from 'ton-core';
import { Config, getHttpEndpoint } from '@orbs-network/ton-access';

export enum AccountState {
    Unknown = 0,
    Requested = 1,
    Approved = 2,
    Declined = 3,
}

const deploymentPath = `data${path.sep}deployment.json`;

export const AccountsDictionaryKey = Dictionary.Keys.BigUint(256);
export const AccountsDictionaryValue = Dictionary.Values.Uint(8);
export type AccountsDictionary = Dictionary<bigint, number>;

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

export const createDeployment = (): Deployment => {
    const contracts: ContractInfo[] = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

    const infoByName = new Map<string, ContractInfo>();
    const infoByAddress = new Map<string, ContractInfo>();

    for (const contract of contracts) {
        infoByName.set(contract.name, contract);
        infoByAddress.set(contract.address, contract);
    }

    return {
        getContractWithAddress(address: string): ContractInfo | undefined {
            return infoByAddress.get(address);
        },
        getContractWithName(name: string): ContractInfo | undefined {
            return infoByName.get(name);
        },
        pushContract(info: ContractInfo): void {
            contracts.push(info);
            fs.writeFileSync(deploymentPath, JSON.stringify(contracts, null, 2));
        },
    };
};

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

export function createKycForDeploy(
    initialSeqno: number,
    kycProvider: Buffer,
    fee: number,
    accounts: AccountsDictionary
): Kyc {
    const kycCode = Cell.fromBoc(fs.readFileSync('bin/kyc.cell'))[0]; // compilation output from step 6
    return Kyc.createForDeploy(kycCode, initialSeqno, kycProvider, fee, accounts);
}

export function createKycContract(contractAddress: string): Kyc {
    const counterAddress = Address.parse(contractAddress); // replace with your address from step 8
    return new Kyc(counterAddress);
}

export function createAccountsDictionary(initialStates?: [string, number][]): AccountsDictionary {
    const dict = Dictionary.empty(AccountsDictionaryKey, AccountsDictionaryValue);
    if (initialStates !== undefined) {
        for (const [account, state] of initialStates) {
            let acc = account;
            if (account.startsWith('0x')) {
                acc = account.substring(2);
            }
            dict.set(
                BigInt(Number.parseInt(acc, 16)),
                // beginCell().storeUint(state, 8).endCell()
                state
            );
        }
    }
    return dict;
}
export async function convertMnemonicToPrivateKey(mnemonic: string, filename: string) {
    const key = await mnemonicToPrivateKey(mnemonic.split(' '));
    console.log(`Export private key to ${filename} file. Public key: 0x${key.publicKey.toString('hex')}`);
    fs.writeFileSync(filename, key.secretKey);
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
