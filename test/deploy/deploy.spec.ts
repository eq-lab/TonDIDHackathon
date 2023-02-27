import * as fs from 'fs';
import { Cell, Dictionary } from 'ton-core';
import { Blockchain, OpenedContract, TreasuryContract } from '@ton-community/sandbox';
import { Kyc } from '../../src/kyc';
import {
    AccountState,
    convertGramToNum,
    convertNumToGram,
    createAccountsDictionary,
    createKycForDeploy,
} from '../../src/utils/common';
import { equal } from 'assert'; // this is the interface class from tutorial 2
import { mnemonicToWalletKey } from 'ton-crypto';

describe('Deploy', () => {
    let blockchain: Blockchain;
    let wallet1: OpenedContract<TreasuryContract>;
    let kycContract: OpenedContract<Kyc>;

    const initialSeqno = 17;
    const mnemonics 
        = 'casino trouble angle nature rigid describe lava angry cradle announce keep blanket what later public question master smooth mask visa salt middle announce gentle';
    const initialFee = 0.5;
    const initialAccounts: [string, AccountState][] = [
        ['0', AccountState.Requested],
        ['1', AccountState.Approved],
        ['2', AccountState.Declined],
    ];
    const initialDict = createAccountsDictionary(initialAccounts);

    beforeEach(async () => {
        // prepare Counter's initial code and data cells for deployment
        const initialProvider = await mnemonicToWalletKey(mnemonics.split(' '));
        const kyc = createKycForDeploy(initialSeqno, initialProvider.publicKey, initialFee, initialDict);

        // initialize the blockchain sandbox
        blockchain = await Blockchain.create();
        wallet1 = await blockchain.treasury('user1');

        // deploy kyc contract
        kycContract = blockchain.openContract(kyc);
        await kycContract.sendDeploy(wallet1.getSender());
    });

    it('seqno', async () => {
        const seqno = await kycContract.getSeqno();
        expect(Number(seqno)).toEqual(initialSeqno);
    });

    it('provider', async () => {
        const initialProvider = await mnemonicToWalletKey(mnemonics.split(' '));
        const provider = await kycContract.getProvider();
        expect(provider).toEqual(initialProvider.publicKey.toString('hex'));
    });

    it('fee', async () => {
        const fee = await kycContract.getFee();
        expect(convertGramToNum(fee)).toEqual(initialFee);
    });

    it('accounts', async () => {
        const accounts = await kycContract.getAccountsData();
        const accStates = [];
        for (const [acc, val] of accounts) {
            accStates.push([acc.toString(), val]);
        }
        expect(accStates).toEqual(initialAccounts);
    });
});
