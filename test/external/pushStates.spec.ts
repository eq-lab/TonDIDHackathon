import * as fs from 'fs';
import { Cell, Dictionary } from 'ton-core';
import { Blockchain, OpenedContract, TreasuryContract } from '@ton-community/sandbox';
import { Kyc } from '../../src/kyc';
import {
    convertGramToNum,
    convertNumToGram,
    createAccountsDictionary,
    createKycForDeploy,
} from '../../src/utils/common';

describe('External::setup', () => {
    let blockchain: Blockchain;
    let wallet1: OpenedContract<TreasuryContract>;
    let kycContract: OpenedContract<Kyc>;

    const initialSeqno = 17;
    const initialProvider = '0xc0681cb4375e11e6b2f75ff84e875c6ae02aea67d28f85c9ab2f2bb8ec382e69';
    const initialFee = 0.5;
    const initialAccounts = createAccountsDictionary([
        ['0', 0],
        ['1', 1],
        ['2', 2],
    ]);

    const newAccounts = createAccountsDictionary([['3', 2]]);

    beforeEach(async () => {
        // prepare Counter's initial code and data cells for deployment
        const kyc = createKycForDeploy(initialSeqno, initialProvider, initialFee, initialAccounts);

        // initialize the blockchain sandbox
        blockchain = await Blockchain.create();
        wallet1 = await blockchain.treasury('user1');

        // deploy counter
        kycContract = blockchain.openContract(kyc);
        await kycContract.sendDeploy(wallet1.getSender());
    });

    it('seqno', async () => {
        const seqno = await kycContract.getSeqno();
        expect(Number(seqno)).toEqual(initialSeqno);
    });

    it('provider', async () => {
        const provider = await kycContract.getProvider();
        expect(provider).toEqual(initialProvider);
    });

    it('fee', async () => {
        const fee = await kycContract.getFee();
        expect(convertGramToNum(fee)).toEqual(initialFee);
    });

    it('accounts', async () => {
        const accounts = await kycContract.getAccountsData();
        // todo
    });
});
