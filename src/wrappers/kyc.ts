import {
    Contract,
    ContractProvider,
    Sender,
    Address,
    Cell,
    contractAddress,
    beginCell,
    Dictionary,
    TupleReader,
} from 'ton-core';
import {
    AccountsDictionary,
    AccountsDictionaryKey,
    AccountsDictionaryValue,
    AccountState,
    convertNumToGram,
    DnsMaxLengthBytes,
    encodeDomainName,
} from '../common';
import { TupleItemSlice } from 'ton-core/src/tuple/tuple';
import { KeyPair, sha256, sign } from 'ton-crypto';

export enum ActionExternal {
    Setup = 0,
    SetAccState = 1,
}

export enum ActionInternal {
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
        const data = beginCell()
            .storeUint(initialSeqno, 32)
            .storeBuffer(kycProvider)
            .storeCoins(convertNumToGram(fee))
            .storeDict(accounts)
            .endCell();
        const workchain = 0; // deploy to workchain 0
        const address = contractAddress(workchain, { code, data });
        return new Kyc(address, { code, data });
    }

    async sendDeploy(provider: ContractProvider, via: Sender, initialDeposit: number): Promise<void> {
        await provider.internal(via, {
            value: initialDeposit.toString(), // send TON to contract for rent
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
        const acc = encodeDomainName(account);
        const cell = beginCell().storeBuffer(acc, DnsMaxLengthBytes).endCell();
        //@ts-ignore
        const address = <TupleItemSlice>{ type: 'slice', cell };
        // @ts-ignore
        const { stack } = await provider.get('get_account_state', [address]);
        return Number(stack.readBigNumber());
    }

    async getAccountsData(provider: ContractProvider): Promise<AccountsDictionary> {
        if (await this.getAccountsDataIsEmpty(provider)) {
            return Dictionary.empty();
        }
        const { stack } = await provider.get('get_accounts_data', []);
        const cell = stack.readCell();
        return Dictionary.loadDirect(AccountsDictionaryKey, AccountsDictionaryValue, cell);
    }

    async getAccountsDataIsEmpty(provider: ContractProvider): Promise<boolean> {
        const { stack } = await provider.get('accounts_data_is_empty', []);
        const isEmpty = stack.readNumber();
        console.log(`IS EMPTY: `, isEmpty);
        return isEmpty !== 0;
    }
    async sendRequestKyc(provider: ContractProvider, account: string, via: Sender): Promise<void> {
        const acc = encodeDomainName(account);
        const message = beginCell()
            .storeUint(ActionInternal.RequestKyc, 4) // op
            .storeBuffer(acc, DnsMaxLengthBytes) // DNS
            .endCell();

        const fee = await this.getFee(provider);
        await this.sendInternal(provider, message, fee, via);
    }

    async sendInternal(provider: ContractProvider, message: Cell, value: bigint, via: Sender): Promise<void> {
        await provider.internal(via, {
            value, // send TON for gas
            body: message,
        });
    }

    async sendSetup(
        provider: ContractProvider,
        oldKycProvider: KeyPair,
        newKycProvider: string,
        fee: number
    ): Promise<void> {
        const currentSeqno = await this.getSeqno(provider);
        const feeCoins = convertNumToGram(fee);
        const args = Buffer.alloc(47);
        args.write(newKycProvider, 'hex');
        args.writeBigUInt64BE(feeCoins, 39);
        const hash = await sha256(args);
        const signature = sign(hash, oldKycProvider.secretKey);

        const messageBody = beginCell()
            .storeUint(ActionExternal.Setup, 4)
            .storeUint(currentSeqno, 32)
            .storeRef(beginCell().storeBuffer(args).endCell())
            .storeBuffer(signature)
            .endCell();

        await provider.external(messageBody);
    }

    async sendSetAccState(
        provider: ContractProvider,
        kycProvider: KeyPair,
        account: string,
        state: AccountState
    ): Promise<void> {
        const seqno = await this.getSeqno(provider);
        const acc = encodeDomainName(account);
        const msgBody = Buffer.concat([acc, Buffer.from([state])]);

        const hash = await sha256(msgBody);
        const signature = sign(hash, kycProvider.secretKey);
        const dataCell = beginCell().storeBuffer(msgBody).endCell();
        const messageBody = beginCell()
            .storeUint(ActionExternal.SetAccState, 4)
            .storeUint(seqno, 32)
            .storeRef(dataCell)
            .storeBuffer(signature)
            .endCell();

        await provider.external(messageBody);
    }

    async sendExternal(provider: ContractProvider, messageBody: Cell): Promise<void> {
        await provider.external(messageBody);
    }

    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}
}
