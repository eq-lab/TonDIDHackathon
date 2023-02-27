import * as fs from 'fs';
import { Cell, Dictionary } from 'ton-core';
import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Kyc } from '../../src/kyc';
import {
    AccountState,
    convertGramToNum,
    convertNumToGram,
    createAccountsDictionary,
    createKycForDeploy,
} from '../../src/utils/common';

describe('External::setAccState', () => {
    let blockchain: Blockchain;
    let wallet1: SandboxContract<TreasuryContract>;
    let kycContract: SandboxContract<Kyc>;

    const initialSeqno = 17;
    const initialProvider = '0xc0681cb4375e11e6b2f75ff84e875c6ae02aea67d28f85c9ab2f2bb8ec382e69';

    const initialFee = 0.5;
    const initialAccounts: [string, AccountState][] = [
        ['0x0000000000000000000000000000000000000000000000000000000000000001', AccountState.Requested],
        ['0x0000000000000000000000000000000000000000000000000000000000000002', AccountState.Approved],
        ['0x0000000000000000000000000000000000000000000000000000000000000003', AccountState.Declined],
    ];
    const initialDict = createAccountsDictionary(initialAccounts);

    const newAcc = '0x0000000000000000000000000000000000000000000000000000000000000004';
    const newAccState = AccountState.Approved;

    beforeEach(async () => {
        // prepare Counter's initial code and data cells for deployment
        const kyc = createKycForDeploy(initialSeqno, initialProvider, initialFee, initialDict);

        // initialize the blockchain sandbox
        blockchain = await Blockchain.create();
        wallet1 = await blockchain.treasury('user1');

        // deploy kyc contract
        kycContract = blockchain.openContract(kyc);
        await kycContract.sendDeploy(wallet1.getSender());
    });

    it('seqno', async () => {
        await kycContract.sendSetAccState(newAcc, newAccState);
        const seqno = await kycContract.getSeqno();
        expect(Number(seqno)).toEqual(initialSeqno + 1);
    });

    it('provider', async () => {
        await kycContract.sendSetAccState(newAcc, newAccState);
        const provider = await kycContract.getProvider();
        expect(provider).toEqual(initialProvider);
    });

    it('fee', async () => {
        await kycContract.sendSetAccState(newAcc, newAccState);
        const fee = await kycContract.getFee();
        expect(convertGramToNum(fee)).toEqual(initialFee);
    });

    it('accounts', async () => {
        await kycContract.sendSetAccState(newAcc, newAccState);

        const accounts = await kycContract.getAccountsData();

        const accStates = [];
        for (const [acc, val] of accounts) {
            accStates.push([acc.toString(), val]);
        }
        const expected = initialAccounts.map(([acc, val]) => {
            return [Number.parseInt(acc.slice(2), 16).toString(), val];
        });
        expected.push([Number.parseInt(newAcc, 16).toString(), newAccState]);
        expect(accStates).toEqual(expected);
    });
});
