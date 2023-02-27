import * as fs from 'fs';
import { Cell, Dictionary, Sender } from 'ton-core';
import { Blockchain, OpenedContract, TreasuryContract } from '@ton-community/sandbox';
import { Kyc } from '../../src/kyc';
import {
    AccountState,
    convertGramToNum,
    convertNumToGram,
    createAccountsDictionary,
    createKycForDeploy,
} from '../../src/utils/common';
import { mnemonicToWalletKey } from 'ton-crypto';

describe('Internal::requestKyc', () => {
    let blockchain: Blockchain;
    let wallet1: OpenedContract<TreasuryContract>;
    let userWallet: OpenedContract<TreasuryContract>;
    let kycContract: OpenedContract<Kyc>;

    const initialSeqno = 17;
    const mnemonics 
        = 'casino trouble angle nature rigid describe lava angry cradle announce keep blanket what later public question master smooth mask visa salt middle announce gentle';

    const initialFee = 0.5;
    const initialAccounts: [string, AccountState][] = [
        ['0x0000000000000000000000000000000000000000000000000000000000000001', AccountState.Requested],
        ['0x0000000000000000000000000000000000000000000000000000000000000002', AccountState.Approved],
        ['0x0000000000000000000000000000000000000000000000000000000000000003', AccountState.Declined],
    ];
    const initialDict = createAccountsDictionary(initialAccounts);

    const unknownAccount = '0x0000000000000000000000000000000000000000000000000000000000000011';

    beforeEach(async () => {
        // prepare Counter's initial code and data cells for deployment
        const initialProvider = await mnemonicToWalletKey(mnemonics.split(" "));
        const kyc = createKycForDeploy(initialSeqno, initialProvider.publicKey, initialFee, initialDict);

        // initialize the blockchain sandbox
        blockchain = await Blockchain.create();
        wallet1 = await blockchain.treasury('user1');
        userWallet = await blockchain.treasury('userwallet1');
        // deploy kyc contract
        kycContract = blockchain.openContract(kyc);
        await kycContract.sendDeploy(wallet1.getSender());
    });

    it('unknown account', async () => {
        const stateBeforeRequest = await kycContract.getAccountState(unknownAccount);
        expect(stateBeforeRequest).toEqual(AccountState.Unknown);
        const userBalanceBefore = (await blockchain.getContract(userWallet.address)).balance;
        const contractBalanceBefore = (await blockchain.getContract(kycContract.address)).balance;
        await kycContract.sendRequestKyc(unknownAccount, userWallet.getSender());

        const stateAfterRequest = await kycContract.getAccountState(unknownAccount);
        expect(stateAfterRequest).toEqual(AccountState.Requested);

        const userBalanceAfter = (await blockchain.getContract(userWallet.address)).balance;
        const contractBalanceAfter = (await blockchain.getContract(kycContract.address)).balance;
        // console.log(`User. Before: ${userBalanceBefore}, after: ${userBalanceAfter}`);
        // console.log(`Contract. Before: ${contractBalanceBefore}, after: ${contractBalanceAfter}`);
    });

    it('already known account', async () => {
        const stateBeforeRequest = await kycContract.getAccountState(unknownAccount);
        expect(stateBeforeRequest).toEqual(AccountState.Unknown);

        await kycContract.sendRequestKyc(unknownAccount, userWallet.getSender());

        const stateAfterRequest = await kycContract.getAccountState(unknownAccount);
        expect(stateAfterRequest).toEqual(AccountState.Requested);

        // must throw error
        await kycContract.sendRequestKyc(unknownAccount, userWallet.getSender());

        const stateAfterSecondRequest = await kycContract.getAccountState(unknownAccount);
        expect(stateAfterSecondRequest).toEqual(AccountState.Requested);
    });
});
