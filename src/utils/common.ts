import {Address, TonClient, WalletContractV4} from "ton";
import * as fs from "fs";
import path from "path";
import {mnemonicToPrivateKey} from "ton-crypto/dist/mnemonic/mnemonic";
import { Kyc } from "../kyc";
import {KeyPair, mnemonicToWalletKey} from "ton-crypto";
import {Contract, Sender} from "ton-core";
import {Config, getHttpEndpoint} from "@orbs-network/ton-access";

const deploymentPath = `data${path.sep}deployment.json`

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
    const contracts: ContractInfo[]= JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

    const infoByName = new Map<string, ContractInfo>();
    const infoByAddress = new Map<string, ContractInfo>();

    for (const contract of contracts) {
        infoByName.set(contract.name, contract)
        infoByAddress.set(contract.address, contract)
    }

    return {
        getContractWithAddress(address: string): ContractInfo | undefined {
            return infoByAddress.get(address);
        }, getContractWithName(name: string): ContractInfo | undefined {
            return infoByName.get(name);
        }, pushContract(info: ContractInfo): void {
            contracts.push(info);
            fs.writeFileSync(deploymentPath, JSON.stringify(contracts, null, 2));
        }
    }
}

export async function createTonClient(config: Config): Promise<TonClient> {
    const endpoint = await getHttpEndpoint({ network: "testnet" });
    return new TonClient({ endpoint });

}

export async function createWalletContract(client: TonClient, key: KeyPair): Promise<WalletContractV4> {
    // open wallet v4 (notice the correct wallet version here)
    const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
    if (!await client.isContractDeployed(wallet.address)) {
        throw "createWallet: wallet is not deployed";
    }
    return wallet;
}

export function createKycContract(contractAddress: string): Kyc {
    const counterAddress = Address.parse(contractAddress); // replace with your address from step 8
    return new Kyc(counterAddress);
}

export async function convertMnemonicToPrivateKey(mnemonic: string, filename: string) {
    const key = await mnemonicToPrivateKey(mnemonic.split(" "));
    console.log(`Export private key to ${filename} file. Public key: 0x${key.publicKey.toString('hex')}`);
    fs.writeFileSync(filename, key.secretKey);
}

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function convertNumToGram(num: number): number{
    return num * 1000000000;
}

export function convertGramToNum(gram: bigint): number{
    return Number(gram) / 1000000000;
}