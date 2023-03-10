import { Address, Cell, TonClient, WalletContractV4 } from 'ton';
import * as fs from 'fs';
import { mnemonicToPrivateKey } from 'ton-crypto/dist/mnemonic/mnemonic';
import { DidIssuer } from '../wrappers/DidIssuer';
import { KeyPair } from 'ton-crypto';
import { Dictionary } from 'ton-core';
import { Config, getHttpEndpoint } from '@orbs-network/ton-access';

export enum AccountState {
    Unknown = 0,
    Requested = 1,
    Approved = 2,
    Declined = 3,
}

export enum ExitCodes {
    WrongSeqno = 70,
    WrongSignature = 71,
    WrongArgsHash = 72,
    IncorrectFees = 80,
    AccountAlreadyExisted = 81,
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

export const createDeployment = (deploymentPath: string): Deployment => {
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
        throw new Error('createWallet: wallet is not deployed');
    }
    return wallet;
}

export function createDidIssuerForDeploy(
    contractFileName: string,
    initialSeqno: number,
    didProvider: Buffer,
    fee: number,
    accounts: AccountsDictionary
): DidIssuer {
    const didIssuerCode = Cell.fromBoc(fs.readFileSync(contractFileName))[0]; // compilation output from step 6
    return DidIssuer.createForDeploy(didIssuerCode, initialSeqno, didProvider, fee, accounts);
}

export function createDidIssuerContract(contractAddress: string): DidIssuer {
    const counterAddress = Address.parse(contractAddress); // replace with your address from step 8
    return new DidIssuer(counterAddress);
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

export function encodeDomainName(name: string): Buffer {
    if (!name.endsWith('.ton')) {
        throw new Error(`domain name must contains .ton!`);
    }
    const buffer = Buffer.from(removeTonTopDomain(name), 'utf8');
    const filler = Buffer.alloc(DnsMaxLengthBytes - buffer.length, 0);
    return Buffer.concat([filler, buffer]);
}

export function removeTonTopDomain(domain: string) {
    if (!domain.endsWith('.ton')) {
        return domain;
    }
    return domain.slice(0, -4);
}

export function decodeDomainName(encodedName: Buffer): string {
    const startIndex = encodedName.findIndex((byte) => byte !== 0);
    return encodedName.subarray(startIndex).toString('utf8');
}

export function convertPublickKeyStringToBuffer(publicKey: string): Buffer {
    if (publicKey.startsWith('0x')) {
        publicKey = publicKey.slice(2);
    }
    const providerBuffer = Buffer.from(publicKey, 'hex');
    if (providerBuffer.length != 32) {
        throw new Error(`incorrect provider public key length! Expected: 32, actual: ${providerBuffer.length}`);
    }
    return providerBuffer;
}
