import { beginCell } from 'ton-core';
import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import '@ton-community/test-utils';
import { ActionInternal, Kyc } from '../../src/kyc';
import { AccountState, createAccountsDictionary, createKycForDeploy, ExitCodes } from '../../src/utils/common';
import { mnemonicToWalletKey } from 'ton-crypto';

describe('Internal::requestKyc', () => {
    let blockchain: Blockchain;
    let wallet1: SandboxContract<TreasuryContract>;
    let userWallet: SandboxContract<TreasuryContract>;
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

    const unknownAccount = '0x0000000000000000000000000000000000000000000000000000000000000011';

    beforeEach(async () => {
        // prepare Counter's initial code and data cells for deployment
        const initialProvider = await mnemonicToWalletKey(mnemonics.split(' '));
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

        const req = await kycContract.sendRequestKyc(unknownAccount, userWallet.getSender());
        expect(req.transactions).toHaveTransaction({
            from: userWallet.address,
            to: kycContract.address,
            success: true,
        });

        const stateAfterRequest = await kycContract.getAccountState(unknownAccount);
        expect(stateAfterRequest).toEqual(AccountState.Requested);

        const userBalanceAfter = (await blockchain.getContract(userWallet.address)).balance;
        const contractBalanceAfter = (await blockchain.getContract(kycContract.address)).balance;

        const requiredFee = await kycContract.getFee();
        const [userTx, updateStorageTx] = req.transactions;

        if (updateStorageTx.inMessage?.info.type !== 'internal') {
            throw 'parse error';
        }
        const expectedFees =
            userBalanceBefore - requiredFee - userTx.totalFees.coins - updateStorageTx.inMessage.info.forwardFee;

        expect(userBalanceAfter).toEqual(expectedFees);
        expect(contractBalanceAfter).toEqual(contractBalanceBefore + requiredFee - updateStorageTx.totalFees.coins);

        // console.log(
        //     `User. Before: ${userBalanceBefore}, after: ${userBalanceAfter}. Delta: ${
        //         userBalanceAfter - userBalanceBefore
        //     }`
        // );
        // console.log(
        //     `Kyc contract. Before: ${contractBalanceBefore}, after: ${contractBalanceAfter}. Delta: ${
        //         contractBalanceAfter - contractBalanceBefore
        //     }`
        // );
    });

    it('already known account', async () => {
        const stateBeforeRequest = await kycContract.getAccountState(initialAccounts[0][0]);
        expect(stateBeforeRequest).toEqual(initialAccounts[0][1]);

        // must throw error
        const req = await kycContract.sendRequestKyc(initialAccounts[0][0], userWallet.getSender());
        expect(req.transactions).toHaveTransaction({
            from: userWallet.address,
            to: kycContract.address,
            exitCode: ExitCodes.AccountAlreadyExisted,
        });

        const stateAfterRequest = await kycContract.getAccountState(initialAccounts[0][0]);
        expect(stateAfterRequest).toEqual(initialAccounts[0][1]);
    });

    it('incorrect fee amount', async () => {
        const stateBeforeRequest = await kycContract.getAccountState(unknownAccount);
        expect(stateBeforeRequest).toEqual(AccountState.Unknown);

        let acc = unknownAccount;
        if (unknownAccount.startsWith('0x')) {
            acc = unknownAccount.substring(2);
        }
        const message = beginCell()
            .storeUint(ActionInternal.RequestKyc, 4) // op
            .storeUint(Number.parseInt(acc, 16), 256) // account
            .endCell();

        const fee = (await kycContract.getFee()) - 10n;

        const req = await kycContract.sendInternal(message, fee, userWallet.getSender());
        expect(req.transactions).toHaveTransaction({
            from: userWallet.address,
            to: kycContract.address,
            exitCode: ExitCodes.IncorrectFees,
        });

        const stateAfterRequest = await kycContract.getAccountState(unknownAccount);
        expect(stateAfterRequest).toEqual(AccountState.Unknown);
    });
});
