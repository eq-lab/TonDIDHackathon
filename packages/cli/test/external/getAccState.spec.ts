import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Kyc } from '@kyc/contracts/src/wrappers/kyc';
import { AccountState, createAccountsDictionary, createKycForDeploy } from '@kyc/contracts/src/common';
import { mnemonicToWalletKey } from 'ton-crypto';
import { kycContractFileName } from '../../src/common';

describe('External::getAccState', () => {
    let blockchain: Blockchain;
    let wallet1: SandboxContract<TreasuryContract>;
    let kycContract: SandboxContract<Kyc>;

    const initialSeqno = 17;
    const mnemonics =
        'casino trouble angle nature rigid describe lava angry cradle announce keep blanket what later public question master smooth mask visa salt middle announce gentle';

    const initialFee = 0.5;
    const initialAccounts: [string, AccountState][] = [
        ['user_1.ton', AccountState.Requested],
        ['user_2.ton', AccountState.Approved],
        ['user_3.ton', AccountState.Declined],
    ];
    const initialDict = createAccountsDictionary(initialAccounts);

    const unknownAccount = 'user_4.ton';

    beforeEach(async () => {
        // prepare Counter's initial code and data cells for deployment
        const initialProvider = await mnemonicToWalletKey(mnemonics.split(' '));
        const kyc = createKycForDeploy(
            kycContractFileName,
            initialSeqno,
            initialProvider.publicKey,
            initialFee,
            initialDict
        );

        // initialize the blockchain sandbox
        blockchain = await Blockchain.create();
        wallet1 = await blockchain.treasury('user1');

        // deploy kyc contract
        kycContract = blockchain.openContract(kyc);
        await kycContract.sendDeploy(wallet1.getSender(), 0.01);
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
