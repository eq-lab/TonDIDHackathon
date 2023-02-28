import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { ActionExternal, Kyc } from '../../src/wrappers/kyc';
import {
    AccountState,
    convertGramToNum,
    convertNumToGram,
    createAccountsDictionary,
    createKycForDeploy,
    decodeDomainName,
    ExitCodes,
} from '../../src/common';
import { mnemonicNew, mnemonicToWalletKey, sha256, sign } from 'ton-crypto';
import { beginCell } from 'ton-core';

describe('External::setup', () => {
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
        await kycContract.sendSetup(oldProvider, newProvider.publicKey.toString('hex'), newFee);
        const seqno = await kycContract.getSeqno();
        expect(Number(seqno)).toEqual(initialSeqno + 1);
    });

    it('provider', async () => {
        const oldProvider = await mnemonicToWalletKey(mnemonics.split(' '));
        const newProvider = await mnemonicToWalletKey(newProviderMnemonics.split(' '));
        await kycContract.sendSetup(oldProvider, newProvider.publicKey.toString('hex'), newFee);
        const provider = await kycContract.getProvider();
        expect(provider).toEqual(newProvider.publicKey.toString('hex'));
    });

    it('fee', async () => {
        const oldProvider = await mnemonicToWalletKey(mnemonics.split(' '));
        const newProvider = await mnemonicToWalletKey(newProviderMnemonics.split(' '));
        await kycContract.sendSetup(oldProvider, newProvider.publicKey.toString('hex'), newFee);
        const fee = await kycContract.getFee();
        expect(convertGramToNum(fee)).toEqual(newFee);
    });

    it('accounts', async () => {
        const oldProvider = await mnemonicToWalletKey(mnemonics.split(' '));
        const newProvider = await mnemonicToWalletKey(newProviderMnemonics.split(' '));
        await kycContract.sendSetup(oldProvider, newProvider.publicKey.toString('hex'), newFee);
        const accounts = await kycContract.getAccountsData();

        const accStates = [];
        for (const [acc, val] of accounts) {
            accStates.push([decodeDomainName(acc), val]);
        }
        expect(accStates).toEqual(initialAccounts);
    });

    it('wrong signature', async () => {
        const wrongMnemonic = await mnemonicNew(24);
        const wrongKycProvider = await mnemonicToWalletKey(wrongMnemonic);
        const newProvider = await mnemonicToWalletKey(newProviderMnemonics.split(' '));
        let errorArgs: any[] | undefined;

        try {
            console.error = (...args) => {
                errorArgs = args;
            };
            await kycContract.sendSetup(wrongKycProvider, newProvider.publicKey.toString('hex'), newFee);
        } catch (err) {
            expect(err).toEqual(Error('Error executing transaction'));
        } finally {
            expect(errorArgs).toBeDefined(); // to be sure transaction failed
            expect(errorArgs![3].vmExitCode).toEqual(ExitCodes.WrongSignature);
        }
    });

    it('wrong seqno', async () => {
        const oldProvider = await mnemonicToWalletKey(mnemonics.split(' '));
        const newProvider = await mnemonicToWalletKey(newProviderMnemonics.split(' '));
        const wrongSeqno = (await kycContract.getSeqno()) + 1n;
        const feeCoins = convertNumToGram(newFee);
        const args = Buffer.alloc(47);
        args.write(newProvider.publicKey.toString('hex'), 'hex');
        args.writeBigUInt64BE(feeCoins, 39);
        const hash = await sha256(args);
        const signature = sign(hash, oldProvider.secretKey);

        const messageBody = beginCell()
            .storeUint(ActionExternal.Setup, 4)
            .storeUint(wrongSeqno, 32)
            .storeRef(beginCell().storeBuffer(args).endCell())
            .storeBuffer(signature)
            .endCell();

        let errorArgs: any[] | undefined;
        try {
            console.error = (...args) => {
                errorArgs = args;
            };
            await kycContract.sendExternal(messageBody);
        } catch (err) {
            expect(err).toEqual(Error('Error executing transaction'));
        } finally {
            expect(errorArgs).toBeDefined(); // to be sure transaction failed
            expect(errorArgs![3].vmExitCode).toEqual(ExitCodes.WrongSeqno);
        }
    });
});
