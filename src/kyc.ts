import { Contract, ContractProvider, Sender, Address, Cell, contractAddress, beginCell, Dictionary } from 'ton-core';
import {
    AccountsDictionary,
    AccountsDictionaryKey,
    AccountsDictionaryValue,
    AccountState,
    convertNumToGram,
} from './utils/common';
import { TupleItemInt } from 'ton-core/src/tuple/tuple';
import { KeyPair, sha256, sign, signVerify } from 'ton-crypto';

enum ActionExternal {
    Setup = 0,
    SetAccState = 1,
}

enum ActionInternal {
    RequestKyc = 0,
}

export class Kyc implements Contract {
    static createForDeploy(
        code: Cell,
        initialSeqno: number,
        kycProvider: Buffer,
        fee: number,
        accounts: AccountsDictionary
    ): Kyc {
        let provider = kycProvider;

        // console.log(`KYC provider: ${provider}`);
        const data = beginCell()
            .storeUint(initialSeqno, 32)
            .storeBuffer(provider)
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
        return `${'0'.repeat(64 - kycProvider.length)}${kycProvider}`;
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

    async sendRequestKyc(provider: ContractProvider, account: string, via: Sender) {
        let acc = account;
        if (account.startsWith('0x')) {
            acc = account.substring(2);
        }
        const message = beginCell()
            .storeUint(ActionInternal.RequestKyc, 4) // op
            .storeUint(Number.parseInt(acc, 16), 256) // account
            .endCell();

        const fee = await this.getFee(provider);
        await this.sendInternal(provider, message, fee, via);
    }

    async sendInternal(provider: ContractProvider, message: Cell, value: bigint, via: Sender) {
        await provider.internal(via, {
            value, // send TON for gas
            body: message,
        });
    }

    async sendSetup(provider: ContractProvider, oldKycProvider: KeyPair, newKycProvider: KeyPair, fee: number) {
        const currentSeqno = await this.getSeqno(provider);
        const feeCoins = convertNumToGram(fee);
        const msgBody = beginCell().storeBuffer(newKycProvider.publicKey).storeCoins(feeCoins).endCell().toBoc();
        const hash = await sha256(msgBody)
        const signature = sign(hash, oldKycProvider.secretKey);
        const messageBody = beginCell()
            .storeUint(ActionExternal.Setup, 4)
            .storeUint(currentSeqno, 32)
            .storeBuffer(newKycProvider.publicKey)
            .storeCoins(feeCoins)
            .storeBuffer(signature)
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
