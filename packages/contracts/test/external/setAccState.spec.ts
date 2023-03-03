import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import '@ton-community/test-utils';
import { ActionExternal, Kyc } from '../../src/wrappers/kyc';
import {
    AccountState,
    convertGramToNum,
    createAccountsDictionary,
    createKycForDeploy,
    decodeDomainName,
    encodeDomainName,
    ExitCodes,
    removeTonTopDomain,
} from '../../src/common';
import { mnemonicNew, mnemonicToWalletKey, sha256, sign } from 'ton-crypto';
import { beginCell } from 'ton-core';
import { kycContractFileName } from '../common';

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

    const initialStorageDict: [string, AccountState][] = initialAccounts.map(([domain, status]) => [
        removeTonTopDomain(domain),
        status,
    ]);

    const newAcc = 'user_4.ton';
    const newAccState = AccountState.Approved;

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
        const expected = initialStorageDict;
        expected.push([removeTonTopDomain(newAcc), newAccState]);

        expect(accStates).toEqual(expected);
    });

    it('wrong signature', async () => {
        const wrongMnemonic = await mnemonicNew(24);
        const wrongKycProvider = await mnemonicToWalletKey(wrongMnemonic);
        let errorArgs: any[] | undefined;

        try {
            console.error = (...args) => {
                errorArgs = args;
            };
            await kycContract.sendSetAccState(wrongKycProvider, newAcc, newAccState);
        } catch (err) {
            expect(err).toEqual(Error('Error executing transaction'));
        } finally {
            expect(errorArgs).toBeDefined(); // to be sure transaction failed
            expect(errorArgs![3].vmExitCode).toEqual(ExitCodes.WrongSignature);
        }
    });

    it('wrong seqno', async () => {
        const wrongSeqno = (await kycContract.getSeqno()) + 1n;
        const kycProvider = await mnemonicToWalletKey(mnemonics.split(' '));
        const acc = encodeDomainName(newAcc);
        const args = Buffer.concat([acc, Buffer.from([newAccState])]);
        const argsHash = await sha256(args);

        const tmp = Buffer.alloc(5);
        tmp.writeUint8(ActionExternal.SetAccState);
        tmp.writeUintBE(Number(wrongSeqno), 1, 4); 

        const msg = Buffer.concat([tmp, argsHash]);
        const msgHash = await sha256(msg);

        const signature = sign(msgHash, kycProvider.secretKey);
        const dataCell = beginCell().storeBuffer(args).endCell();
        const messageBody = beginCell()
            .storeBuffer(msg, 37)
            .storeRef(dataCell)
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
