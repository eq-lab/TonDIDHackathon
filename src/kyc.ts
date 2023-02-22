import {
    Contract,
    ContractProvider,
    Sender,
    Address,
    Cell,
    contractAddress,
    beginCell,
    parseTuple,
    Dictionary,
} from 'ton-core';
import { AccountsDictionaryKey, AccountsDictionaryValue, convertNumToGram } from './utils/common';

enum ActionExternal {
    Setup = 0,
    PushAccStates = 1,
}

export class Kyc implements Contract {
    static createForDeploy(
        code: Cell,
        initialSeqno: number,
        kycProvider: string,
        fee: number,
        accounts: Dictionary<number, number>
    ): Kyc {
        let provider = kycProvider;
        if (kycProvider.startsWith('0x')) {
            provider = kycProvider.substring(2);
        }

        // console.log(`KYC provider: ${provider}`);
        const data = beginCell()
            .storeUint(initialSeqno, 32)
            .storeBuffer(Buffer.from(provider, 'hex'), 32)
            .storeCoins(convertNumToGram(fee))
            .storeDict(accounts)
            .endCell();
        const workchain = 0; // deploy to workchain 0
        const address = contractAddress(workchain, { code, data });
        return new Kyc(address, { code, data });
    }

    async sendDeploy(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            value: '0.01', // send 0.01 TON to contract for rent
            bounce: false,
        });
    }

    async getProvider(provider: ContractProvider): Promise<string> {
        const { stack } = await provider.get('get_provider', []);
        const kycProvider = stack.readBigNumber().toString(16);
        return `0x${kycProvider}`;
    }

    async getFee(provider: ContractProvider): Promise<bigint> {
        const { stack } = await provider.get('get_fee', []);
        return stack.readBigNumber();
    }

    async getSeqno(provider: ContractProvider): Promise<bigint> {
        const { stack } = await provider.get('get_seqno', []);
        return stack.readBigNumber();
    }

    async getAccountStatus(provider: ContractProvider, account: Address): Promise<bigint> {
        const address = beginCell().storeAddress(account).endCell();
        const { stack } = await provider.get('get_accounts_status', parseTuple(address));
        return stack.readBigNumber();
    }

    async getAccountsData(provider: ContractProvider): Promise<Dictionary<number, number>> {
        const { stack } = await provider.get('get_accounts_data', []);
        const cell = stack.readCell();
        const dict = Dictionary.load(AccountsDictionaryKey, AccountsDictionaryValue, cell);
        return dict;
    }

    async sendInternal(provider: ContractProvider, via: Sender) {
        const messageBody = beginCell()
            .storeUint(1, 32) // op (op #1 = increment)
            .storeUint(0, 64) // query id
            .endCell();
        await provider.internal(via, {
            value: '0.002', // send 0.002 TON for gas
            body: messageBody,
        });
    }

    async sendSetup(
        provider: ContractProvider,
        initialSeqno: number,
        kycProvider: string,
        fee: number,
        accounts: Dictionary<number, number>
    ) {
        let kycSigner = kycProvider;
        if (kycProvider.startsWith('0x')) {
            kycSigner = kycProvider.substring(2);
        }
        const messageBody = beginCell()
            .storeUint(ActionExternal.Setup, 4)
            .storeUint(initialSeqno, 32)
            .storeBuffer(Buffer.from(kycSigner, 'hex'), 32)
            .storeCoins(convertNumToGram(fee))
            .storeDict(accounts)
            .endCell();

        // console.log(`EXTERNAL: ${messageBody.toBoc().toString('hex')}`);
        await provider.external(messageBody);
        console.log(`External call executed`);
    }

    async sendExternal(provider: ContractProvider, action: number) {
        const seqno = await this.getSeqno(provider);
        const messageBody = beginCell().storeUint(action, 4).storeUint(seqno, 32).storeUint(0, 256).endCell();

        console.log(`EXTERNAL: ${messageBody.toBoc().toString('hex')}`);
        await provider.external(messageBody);
        console.log(`External call executed`);
    }

    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}
}
