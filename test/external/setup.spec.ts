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

describe('External::setup', () => {
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

    const newProvider = '0x848fe10f13c73b5a2f67d726b560cf6236908ef317dd39dfcecf87b5cd540a5c';
    const newFee = 1.1;

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
        await kycContract.sendSetup(newProvider, newFee);
        const seqno = await kycContract.getSeqno();
        expect(Number(seqno)).toEqual(initialSeqno + 1);
    });

    it('provider', async () => {
        await kycContract.sendSetup(newProvider, newFee);
        const provider = await kycContract.getProvider();
        expect(provider).toEqual(newProvider);
    });

    it('fee', async () => {
        await kycContract.sendSetup(newProvider, newFee);
        const fee = await kycContract.getFee();
        expect(convertGramToNum(fee)).toEqual(newFee);
    });

    it('accounts', async () => {
        await kycContract.sendSetup(newProvider, newFee);
        const accounts = await kycContract.getAccountsData();

        const accStates = [];
        for (const [acc, val] of accounts) {
            accStates.push([acc.toString(), val]);
        }
        const expected = initialAccounts.map(([acc, val]) => {
            return [Number.parseInt(acc.slice(2), 16).toString(), val];
        });
        expect(accStates).toEqual(expected);
    });
});
