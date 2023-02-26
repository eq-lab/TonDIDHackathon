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
    TupleBuilder,
} from 'ton-core';
import {
    AccountsDictionary,
    AccountsDictionaryKey,
    AccountsDictionaryValue,
    AccountState,
    convertNumToGram,
} from './utils/common';
import { TupleItemInt } from 'ton-core/src/tuple/tuple';

enum ActionExternal {
    Setup = 0,
    RequestCheck = 1, // TODO: move to internal calls
    SetAccState = 2,
}

export class Kyc implements Contract {
    static createForDeploy(
        code: Cell,
        initialSeqno: number,
        kycProvider: string,
        fee: number,
        accounts: AccountsDictionary
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

    async getAccountState(provider: ContractProvider, account: string): Promise<number> {
        let acc = account;
        if (account.startsWith('0x')) {
            acc = account.substring(2);
        }
        const address = <TupleItemInt>{ type: 'int', value: BigInt(Number.parseInt(acc, 16)) };
        const { stack } = await provider.get('get_account_state', [address]);
        return Number(stack.readBigNumber());
    }

    async getAccountsData(provider: ContractProvider): Promise<AccountsDictionary> {
        const { stack } = await provider.get('get_accounts_data', []);
        const cell = stack.readCell();
        return Dictionary.loadDirect(AccountsDictionaryKey, AccountsDictionaryValue, cell);
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

    async sendSetup(provider: ContractProvider, kycProvider: string, fee: number) {
        const currentSeqno = await this.getSeqno(provider);

        let kycSigner = kycProvider;
        if (kycProvider.startsWith('0x')) {
            kycSigner = kycProvider.substring(2);
        }
        const messageBody = beginCell()
            .storeUint(ActionExternal.Setup, 4)
            .storeUint(currentSeqno, 32)
            .storeBuffer(Buffer.from(kycSigner, 'hex'), 32)
            .storeCoins(convertNumToGram(fee))
            .endCell();

        await provider.external(messageBody);
    }

    async sendSetAccState(provider: ContractProvider, account: string, state: AccountState) {
        let acc = account;
        if (account.startsWith('0x')) {
            acc = account.substring(2);
        }
        const seqno = await this.getSeqno(provider);

        const messageBody = beginCell()
            .storeUint(ActionExternal.SetAccState, 4)
            .storeUint(seqno, 32)
            .storeBuffer(Buffer.from(acc, 'hex'), 32)
            .storeUint(state, 4)
            .endCell();

        await provider.external(messageBody);
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
