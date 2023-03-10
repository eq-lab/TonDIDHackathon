import { beginCell } from 'ton-core';
import { Blockchain, SandboxContract, SendMessageResult, TreasuryContract } from '@ton-community/sandbox';
import '@ton-community/test-utils';
import { ActionInternal, DidIssuer } from '../../src/wrappers/DidIssuer';
import {
    AccountState,
    createAccountsDictionary,
    createDidIssuerForDeploy,
    decodeDomainName,
    encodeDomainName,
    ExitCodes,
    removeTonTopDomain,
} from '../../src/common';
import { mnemonicToWalletKey } from 'ton-crypto';
import * as util from 'util';
import { didIssuerContractFileName } from '../common';

describe('Internal::request', () => {
    let blockchain: Blockchain;
    let wallet1: SandboxContract<TreasuryContract>;
    let userWallet: SandboxContract<TreasuryContract>;
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

    const newAccount = 'user_4.ton';

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
        userWallet = await blockchain.treasury('userwallet1');
        // deploy DID issuer contract
        didIssuerContract = blockchain.openContract(didIssuer);
        await didIssuerContract.sendDeploy(wallet1.getSender(), 1);
    });

    it('unknown account', async () => {
        const stateBeforeRequest = await didIssuerContract.getAccountState(newAccount);
        expect(stateBeforeRequest).toEqual(AccountState.Unknown);

        const userBalanceBefore = (await blockchain.getContract(userWallet.address)).balance;
        const contractBalanceBefore = (await blockchain.getContract(didIssuerContract.address)).balance;

        const logs: string[] = [];
        const prevConsoleLog = console.log;
        console.log = (...args) => {
            logs.push(util.format(args));
        };
        let req: SendMessageResult;
        try {
            req = await didIssuerContract.sendRequest(newAccount, userWallet.getSender());
        } finally {
            console.log = prevConsoleLog;
        }
        // console.log(`LOGS:`, logs);
        expect(logs.length).toEqual(1);
        // 0xfe = 0b1111111000_00 = 1016 + 2 * 0-bits
        // 1016 bits =  8 bits operation + 1008 bits domain
        const startIdx = logs[0].indexOf('CS{Cell{00fe0') + 'CS{Cell{00fe0'.length + 1;
        // 252 = 1008 / 4 -- length of domain in hex
        const buff = Buffer.from(logs[0].slice(startIdx, startIdx + 253), 'hex');
        const domainName = decodeDomainName(buff);

        expect(domainName).toEqual(removeTonTopDomain(newAccount));
        expect(req.transactions).toHaveTransaction({
            from: userWallet.address,
            to: didIssuerContract.address,
            success: true,
        });

        const stateAfterRequest = await didIssuerContract.getAccountState(newAccount);
        expect(stateAfterRequest).toEqual(AccountState.Requested);

        const userBalanceAfter = (await blockchain.getContract(userWallet.address)).balance;
        const contractBalanceAfter = (await blockchain.getContract(didIssuerContract.address)).balance;

        const requiredFee = await didIssuerContract.getFee();
        const [userTx, updateStorageTx] = req.transactions;

        if (updateStorageTx.inMessage?.info.type !== 'internal') {
            throw new Error('parse error');
        }
        const expectedFees =
            userBalanceBefore - requiredFee - userTx.totalFees.coins - updateStorageTx.inMessage.info.forwardFee;

        expect(userBalanceAfter).toEqual(expectedFees);
        expect(contractBalanceAfter).toEqual(contractBalanceBefore + requiredFee - updateStorageTx.totalFees.coins);
    });

    it('already known account', async () => {
        const stateBeforeRequest = await didIssuerContract.getAccountState(initialAccounts[0][0]);
        expect(stateBeforeRequest).toEqual(initialAccounts[0][1]);

        // must throw error
        const req = await didIssuerContract.sendRequest(initialAccounts[0][0], userWallet.getSender());
        expect(req.transactions).toHaveTransaction({
            from: userWallet.address,
            to: didIssuerContract.address,
            exitCode: ExitCodes.AccountAlreadyExisted,
        });

        const stateAfterRequest = await didIssuerContract.getAccountState(initialAccounts[0][0]);
        expect(stateAfterRequest).toEqual(initialAccounts[0][1]);
    });

    it('incorrect fee amount', async () => {
        const stateBeforeRequest = await didIssuerContract.getAccountState(newAccount);
        expect(stateBeforeRequest).toEqual(AccountState.Unknown);

        let acc = encodeDomainName(newAccount);
        const message = beginCell()
            .storeUint(ActionInternal.Request, 4) // op
            .storeBuffer(acc) // account
            .endCell();

        const fee = (await didIssuerContract.getFee()) - 10n;

        const req = await didIssuerContract.sendInternal(message, fee, userWallet.getSender());
        expect(req.transactions).toHaveTransaction({
            from: userWallet.address,
            to: didIssuerContract.address,
            exitCode: ExitCodes.IncorrectFees,
        });

        const stateAfterRequest = await didIssuerContract.getAccountState(newAccount);
        expect(stateAfterRequest).toEqual(AccountState.Unknown);
    });
});
