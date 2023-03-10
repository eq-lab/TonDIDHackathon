import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { DidIssuer } from '../../src/wrappers/DidIssuer';
import { AccountState, createAccountsDictionary, createDidIssuerForDeploy } from '../../src/common';
import { mnemonicToWalletKey } from 'ton-crypto';
import { didIssuerContractFileName } from '../common';

describe('External::getAccState', () => {
    let blockchain: Blockchain;
    let wallet1: SandboxContract<TreasuryContract>;
    let didIssuerContract: SandboxContract<DidIssuer>;

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
        const didIssuer = createDidIssuerForDeploy(
            didIssuerContractFileName,
            initialSeqno,
            initialProvider.publicKey,
            initialFee,
            initialDict
        );

        // initialize the blockchain sandbox
        blockchain = await Blockchain.create();
        wallet1 = await blockchain.treasury('user1');

        // deploy DID issuer contract
        didIssuerContract = blockchain.openContract(didIssuer);
        await didIssuerContract.sendDeploy(wallet1.getSender(), 0.01);
    });

    it('existed accounts', async () => {
        for (const [acc, expectedState] of initialAccounts) {
            const actualState = await didIssuerContract.getAccountState(acc);
            expect(Number(actualState)).toEqual(expectedState);
        }
    });

    it('not existed accounts', async () => {
        const actualState = await didIssuerContract.getAccountState(unknownAccount);
        expect(Number(actualState)).toEqual(AccountState.Unknown);
    });
});
