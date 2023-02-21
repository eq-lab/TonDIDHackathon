import {Address} from "ton";
import * as fs from "fs";
import path from "path";
import {mnemonicToPrivateKey} from "ton-crypto/dist/mnemonic/mnemonic";

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
            return infoByName.get(address);
        }, getContractWithName(name: string): ContractInfo | undefined {
            return infoByName.get(name);
        }, pushContract(info: ContractInfo): void {
            contracts.push(info);
            fs.writeFileSync(deploymentPath, JSON.stringify(contracts, null, 2));
        }
    }
}


export async function convertMnemonicToPrivateKey(mnemonic: string, filename: string) {
    const key = await mnemonicToPrivateKey(mnemonic.split(" "));
    console.log(`Export private key to ${filename} file. Public key: 0x${key.publicKey.toString('hex')}`);
    fs.writeFileSync(filename, key.secretKey);
}