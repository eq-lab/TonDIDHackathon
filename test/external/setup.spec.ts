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
import { mnemonicToWalletKey } from 'ton-crypto';

describe('External::setup', () => {
    let blockchain: Blockchain;
    let wallet1: SandboxContract<TreasuryContract>;
    let kycContract: SandboxContract<Kyc>;

    const initialSeqno = 17;
    const mnemonics =
        'casino trouble angle nature rigid describe lava angry cradle announce keep blanket what later public question master smooth mask visa salt middle announce gentle';
    const initialFee = 0.5;
    const initialAccounts: [string, AccountState][] = [
        ['0x0000000000000000000000000000000000000000000000000000000000000001', AccountState.Requested],
        ['0x0000000000000000000000000000000000000000000000000000000000000002', AccountState.Approved],
        ['0x0000000000000000000000000000000000000000000000000000000000000003', AccountState.Declined],
    ];
    const initialDict = createAccountsDictionary(initialAccounts);

    const newProviderMnemonics =
        'water nuclear buffalo again today lawn clock clinic isolate harbor armed pyramid aware snow state riot shock crunch hungry payment purity catalog present unable';
    const newFee = 1.1;

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
        const oldProvider = await mnemonicToWalletKey(mnemonics.split(' '));
        const newProvider = await mnemonicToWalletKey(newProviderMnemonics.split(' '));
        await kycContract.sendSetup(oldProvider, newProvider, newFee);
        const seqno = await kycContract.getSeqno();
        expect(Number(seqno)).toEqual(initialSeqno + 1);
    });

    it('provider', async () => {
        const oldProvider = await mnemonicToWalletKey(mnemonics.split(' '));
        const newProvider = await mnemonicToWalletKey(newProviderMnemonics.split(' '));
        await kycContract.sendSetup(oldProvider, newProvider, newFee);
        const provider = await kycContract.getProvider();
        expect(provider).toEqual(newProvider.publicKey.toString('hex'));
    });

    it('fee', async () => {
        const oldProvider = await mnemonicToWalletKey(mnemonics.split(' '));
        const newProvider = await mnemonicToWalletKey(newProviderMnemonics.split(' '));
        await kycContract.sendSetup(oldProvider, newProvider, newFee);
        const fee = await kycContract.getFee();
        expect(convertGramToNum(fee)).toEqual(newFee);
    });

    it('accounts', async () => {
        const oldProvider = await mnemonicToWalletKey(mnemonics.split(' '));
        const newProvider = await mnemonicToWalletKey(newProviderMnemonics.split(' '));
        await kycContract.sendSetup(oldProvider, newProvider, newFee);
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
