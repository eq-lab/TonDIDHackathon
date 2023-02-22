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
import { convertNumToGram } from './utils/common';

export class Kyc implements Contract {
    static createForDeploy(
        code: Cell,
        initialSeqno: number,
        kycProvider: string,
        fee: number,
        accounts: Dictionary<number, boolean>
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
            // .storeCoins(fee) // initial seqno value
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

    async getProvider(provider: ContractProvider) {
        const { stack } = await provider.get('get_provider', []);
        return stack.readBigNumber();
    }

    async getFee(provider: ContractProvider) {
        const { stack } = await provider.get('get_fee', []);
        return stack.readBigNumber();
    }

    async getSeqno(provider: ContractProvider) {
        const { stack } = await provider.get('get_seqno', []);
        return stack.readBigNumber();
    }

    async getAccountStatus(provider: ContractProvider, account: Address) {
        const address = beginCell().storeAddress(account).endCell();
        const { stack } = await provider.get('get_accounts_status', parseTuple(address));
        return stack.readBigNumber();
    }

    async getAccountsData(provider: ContractProvider) {
        const { stack } = await provider.get('get_accounts_data', []);
        return stack.readCell();
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

    async sendExternal(provider: ContractProvider, action: number) {
        const seqno = await this.getSeqno(provider);
        const messageBody = beginCell().storeUint(action, 4).storeUint(seqno, 32).storeUint(0, 256).endCell();

        console.log(`EXTERNAL: ${messageBody.toBoc().toString('hex')}`);
        await provider.external(messageBody);
        console.log(`External call executed`);
    }

    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}
}
