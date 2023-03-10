import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import '@ton-community/test-utils';
import { ActionExternal, DidIssuer } from '../../src/wrappers/DidIssuer';
import {
    AccountState,
    convertGramToNum,
    createAccountsDictionary,
    createDidIssuerForDeploy,
    decodeDomainName,
    encodeDomainName,
    ExitCodes,
    removeTonTopDomain,
} from '../../src/common';
import { mnemonicNew, mnemonicToWalletKey, sha256, sign } from 'ton-crypto';
import { beginCell } from 'ton-core';
import { didIssuerContractFileName } from '../common';

describe('External::setAccState', () => {
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

    const newAcc = 'user_4.ton';
    const newAccState = AccountState.Approved;

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

    it('seqno increased', async () => {
        const didProvider = await mnemonicToWalletKey(mnemonics.split(' '));
        await didIssuerContract.sendSetAccState(didProvider, newAcc, newAccState);
        const seqno = await didIssuerContract.getSeqno();
        expect(Number(seqno)).toEqual(initialSeqno + 1);
    });

    it('provider not changed', async () => {
        const didProvider = await mnemonicToWalletKey(mnemonics.split(' '));
        await didIssuerContract.sendSetAccState(didProvider, newAcc, newAccState);
        const provider = await didIssuerContract.getProvider();
        expect(provider).toEqual(didProvider.publicKey.toString('hex'));
    });

    it('fee not changed', async () => {
        const didProvider = await mnemonicToWalletKey(mnemonics.split(' '));
        await didIssuerContract.sendSetAccState(didProvider, newAcc, newAccState);
        const fee = await didIssuerContract.getFee();
        expect(convertGramToNum(fee)).toEqual(initialFee);
    });

    it('accounts updated', async () => {
        const didProvider = await mnemonicToWalletKey(mnemonics.split(' '));
        await didIssuerContract.sendSetAccState(didProvider, newAcc, newAccState);

        const accounts = await didIssuerContract.getAccountsData();

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
        const wrongDidProvider = await mnemonicToWalletKey(wrongMnemonic);
        let errorArgs: any[] | undefined;

        try {
            console.error = (...args) => {
                errorArgs = args;
            };
            await didIssuerContract.sendSetAccState(wrongDidProvider, newAcc, newAccState);
        } catch (err) {
            expect(err).toEqual(Error('Error executing transaction'));
        } finally {
            expect(errorArgs).toBeDefined(); // to be sure transaction failed
            expect(errorArgs![3].vmExitCode).toEqual(ExitCodes.WrongSignature);
        }
    });

    it('wrong seqno', async () => {
        const wrongSeqno = (await didIssuerContract.getSeqno()) + 1n;
        const didProvider = await mnemonicToWalletKey(mnemonics.split(' '));
        const acc = encodeDomainName(newAcc);
        const args = Buffer.concat([acc, Buffer.from([newAccState])]);
        const argsHash = await sha256(args);

        const tmp = Buffer.alloc(5);
        tmp.writeUint8(ActionExternal.SetAccState);
        tmp.writeUintBE(Number(wrongSeqno), 1, 4);

        const msg = Buffer.concat([tmp, argsHash]);
        const msgHash = await sha256(msg);

        const signature = sign(msgHash, didProvider.secretKey);
        const dataCell = beginCell().storeBuffer(args).endCell();
        const messageBody = beginCell().storeBuffer(msg, 37).storeRef(dataCell).storeBuffer(signature).endCell();

        let errorArgs: any[] | undefined;
        try {
            console.error = (...args) => {
                errorArgs = args;
            };
            await didIssuerContract.sendExternal(messageBody);
        } catch (err) {
            expect(err).toEqual(Error('Error executing transaction'));
        } finally {
            expect(errorArgs).toBeDefined(); // to be sure transaction failed
            expect(errorArgs![3].vmExitCode).toEqual(ExitCodes.WrongSeqno);
        }
    });

    it('wrong args hash', async () => {
        const seqno = await didIssuerContract.getSeqno();
        const didProvider = await mnemonicToWalletKey(mnemonics.split(' '));
        const acc = encodeDomainName(newAcc);
        const args = Buffer.concat([acc, Buffer.from([newAccState])]);
        const wrongArgsHash = Buffer.alloc(32);
        wrongArgsHash.fill(1);

        const tmp = Buffer.alloc(5);
        tmp.writeUint8(ActionExternal.SetAccState);
        tmp.writeUintBE(Number(seqno), 1, 4);

        const msg = Buffer.concat([tmp, wrongArgsHash]);
        const msgHash = await sha256(msg);

        const signature = sign(msgHash, didProvider.secretKey);
        const dataCell = beginCell().storeBuffer(args).endCell();
        const messageBody = beginCell().storeBuffer(msg, 37).storeRef(dataCell).storeBuffer(signature).endCell();

        let errorArgs: any[] | undefined;
        try {
            console.error = (...args) => {
                errorArgs = args;
            };
            await didIssuerContract.sendExternal(messageBody);
        } catch (err) {
            expect(err).toEqual(Error('Error executing transaction'));
        } finally {
            expect(errorArgs).toBeDefined(); // to be sure transaction failed
            expect(errorArgs![3].vmExitCode).toEqual(ExitCodes.WrongArgsHash);
        }
    });
});
