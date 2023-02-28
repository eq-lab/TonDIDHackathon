import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import '@ton-community/test-utils';
import { Kyc } from '../../src/kyc';
import {
    AccountState,
    convertGramToNum,
    createAccountsDictionary,
    createKycForDeploy,
    decodeDomainName,
    ExitCodes,
} from '../../src/utils/common';
import { mnemonicNew, mnemonicToWalletKey } from 'ton-crypto';

describe('External::setAccState', () => {
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

    const newAcc = 'user_4.ton';
    const newAccState = AccountState.Approved;

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

    it('seqno increased', async () => {
        const kycProvider = await mnemonicToWalletKey(mnemonics.split(' '));
        await kycContract.sendSetAccState(kycProvider, newAcc, newAccState);
        const seqno = await kycContract.getSeqno();
        expect(Number(seqno)).toEqual(initialSeqno + 1);
    });

    it('provider not changed', async () => {
        const kycProvider = await mnemonicToWalletKey(mnemonics.split(' '));
        await kycContract.sendSetAccState(kycProvider, newAcc, newAccState);
        const provider = await kycContract.getProvider();
        expect(provider).toEqual(kycProvider.publicKey.toString('hex'));
    });

    it('fee not changed', async () => {
        const kycProvider = await mnemonicToWalletKey(mnemonics.split(' '));
        await kycContract.sendSetAccState(kycProvider, newAcc, newAccState);
        const fee = await kycContract.getFee();
        expect(convertGramToNum(fee)).toEqual(initialFee);
    });

    it('accounts updated', async () => {
        const kycProvider = await mnemonicToWalletKey(mnemonics.split(' '));
        await kycContract.sendSetAccState(kycProvider, newAcc, newAccState);

        const accounts = await kycContract.getAccountsData();

        const accStates = [];
        for (const [acc, val] of accounts) {
            accStates.push([decodeDomainName(acc), val]);
        }
        const expected = initialAccounts;
        expected.push([newAcc, newAccState]);

        expect(accStates).toEqual(expected);
    });

    it('wrong signature', async () => {
        // const wrongMnemonic = await mnemonicNew(24);
        // const wrongKycProvider = await mnemonicToWalletKey(wrongMnemonic);
        // const tx = await kycContract.sendSetAccState(wrongKycProvider, newAcc, newAccState);
        // expect(tx.transactions).toHaveTransaction({
        //     to: kycContract.address,
        //     exitCode: ExitCodes.WrongSignature,
        // });
    });
});
