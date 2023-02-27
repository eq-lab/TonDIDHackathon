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

describe('External::getAccState', () => {
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

    const unknownAccount = '0x0000000000000000000000000000000000000000000000000000000000000011';

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

    it('existed accounts', async () => {
        for (const [acc, expectedState] of initialAccounts) {
            const actualState = await kycContract.getAccountState(acc);
            expect(Number(actualState)).toEqual(expectedState);
        }
    });

    it('not existed accounts', async () => {
        const actualState = await kycContract.getAccountState(unknownAccount);
        expect(Number(actualState)).toEqual(AccountState.Unknown);
    });
});
