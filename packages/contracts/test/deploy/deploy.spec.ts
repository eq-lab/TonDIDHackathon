import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { DidIssuer } from '../../src/wrappers/DidIssuer';
import {
    AccountState,
    convertGramToNum,
    createAccountsDictionary,
    createDidIssuerForDeploy,
    decodeDomainName,
    removeTonTopDomain,
} from '../../src/common';
import { mnemonicToWalletKey } from 'ton-crypto';
import { didIssuerContractFileName } from '../common';

describe('Deploy', () => {
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

    const initialStorageDict: [string, AccountState][] = initialAccounts.map(([domain, status]) => [
        removeTonTopDomain(domain),
        status,
    ]);

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

    it('seqno', async () => {
        const seqno = await didIssuerContract.getSeqno();
        expect(Number(seqno)).toEqual(initialSeqno);
    });

    it('provider', async () => {
        const initialProvider = await mnemonicToWalletKey(mnemonics.split(' '));
        const provider = await didIssuerContract.getProvider();
        expect(provider).toEqual(initialProvider.publicKey.toString('hex'));
    });

    it('fee', async () => {
        const fee = await didIssuerContract.getFee();
        expect(convertGramToNum(fee)).toEqual(initialFee);
    });

    it('accounts', async () => {
        const accounts = await didIssuerContract.getAccountsData();
        const accStates = [];
        for (const [acc, val] of accounts) {
            accStates.push([decodeDomainName(acc), val]);
        }
        expect(accStates).toEqual(initialStorageDict);
    });
});
