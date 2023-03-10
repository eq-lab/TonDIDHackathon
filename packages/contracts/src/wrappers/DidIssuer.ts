import { Contract, ContractProvider, Sender, Address, Cell, contractAddress, beginCell, Dictionary } from 'ton-core';
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
    Request = 0,
}

export class DidIssuer implements Contract {
    static createForDeploy(
        code: Cell,
        initialSeqno: number,
        didProvider: Buffer,
        fee: number,
        accounts: AccountsDictionary
    ): DidIssuer {
        const data = beginCell()
            .storeUint(initialSeqno, 32)
            .storeBuffer(didProvider)
            .storeCoins(convertNumToGram(fee))
            .storeDict(accounts)
            .endCell();
        const workchain = 0; // deploy to workchain 0
        const address = contractAddress(workchain, { code, data });
        return new DidIssuer(address, { code, data });
    }

    async sendDeploy(provider: ContractProvider, via: Sender, initialDeposit: number): Promise<void> {
        await provider.internal(via, {
            value: initialDeposit.toString(), // send TON to contract for rent
            bounce: false,
        });
    }

    async getProvider(provider: ContractProvider): Promise<string> {
        const { stack } = await provider.get('get_provider', []);
        const didProvider = stack.readBigNumber().toString(16);
        return `${'0'.repeat(64 - didProvider.length)}${didProvider}`;
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
            return Dictionary.empty(AccountsDictionaryKey, AccountsDictionaryValue);
        }
        const { stack } = await provider.get('get_accounts_data', []);
        const cell = stack.readCell();
        return Dictionary.loadDirect(AccountsDictionaryKey, AccountsDictionaryValue, cell);
    }

    async getAccountsDataIsEmpty(provider: ContractProvider): Promise<boolean> {
        const { stack } = await provider.get('accounts_data_is_empty', []);
        const isEmpty = stack.readNumber();
        return isEmpty !== 0;
    }
    async sendRequest(provider: ContractProvider, account: string, via: Sender): Promise<void> {
        const acc = encodeDomainName(account);
        const message = beginCell()
            .storeUint(ActionInternal.Request, 8) // op
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
        oldDidProvider: KeyPair,
        newDidProvider: string,
        fee: number
    ): Promise<void> {
        const currentSeqno = await this.getSeqno(provider);
        const feeCoins = convertNumToGram(fee);
        const args = Buffer.alloc(47);
        args.write(newDidProvider, 'hex');
        args.writeBigUInt64BE(feeCoins, 39);
        const argsHash = await sha256(args);

        const tmp = Buffer.alloc(5);
        tmp.writeUint8(ActionExternal.Setup);
        tmp.writeUintBE(Number(currentSeqno), 1, 4);

        const msg = Buffer.concat([tmp, argsHash]);
        const msgHash = await sha256(msg);

        const signature = sign(msgHash, oldDidProvider.secretKey);

        const messageBody = beginCell()
            .storeBuffer(msg, 37)
            .storeBuffer(signature)
            .storeRef(beginCell().storeBuffer(args).endCell())
            .endCell();

        await provider.external(messageBody);
    }

    async sendSetAccState(
        provider: ContractProvider,
        didProvider: KeyPair,
        account: string,
        state: AccountState
    ): Promise<void> {
        const seqno = await this.getSeqno(provider);
        const acc = encodeDomainName(account);
        const args = Buffer.concat([acc, Buffer.from([state])]);

        const argsHash = await sha256(args);

        const tmp = Buffer.alloc(5);
        tmp.writeUint8(ActionExternal.SetAccState);
        tmp.writeUintBE(Number(seqno), 1, 4);

        const msg = Buffer.concat([tmp, argsHash]);
        const msgHash = await sha256(msg);

        const signature = sign(msgHash, didProvider.secretKey);
        const dataCell = beginCell().storeBuffer(args).endCell();
        const messageBody = beginCell().storeBuffer(msg, 37).storeRef(dataCell).storeBuffer(signature).endCell();

        await provider.external(messageBody);
    }

    async sendExternal(provider: ContractProvider, messageBody: Cell): Promise<void> {
        await provider.external(messageBody);
    }

    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}
}
