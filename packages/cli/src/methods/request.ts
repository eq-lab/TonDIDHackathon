import { TonClient } from 'ton';
import {
    ContractInfo,
    createDeployment,
    createDidIssuerContract,
    createWalletContract,
    sleep,
} from '@did-issuer/contracts/dist/common/index.js';
import { mnemonicToWalletKey } from 'ton-crypto';
import { deploymentPath } from '../common';

export async function request(client: TonClient, contractInfo: ContractInfo, mnemonic: string, account: string) {
    console.log(`\nRequest`);

    const deployment = createDeployment(deploymentPath);

    if (deployment.getContractWithName(contractInfo.name) === undefined) {
        throw new Error('unknown contract!');
    }
    const mnem = mnemonic.split(' ');
    const key = await mnemonicToWalletKey(mnem);

    const walletContract = await createWalletContract(client, key);

    const wallet = client.open(walletContract);
    const sender = wallet.sender(key.secretKey);

    const seqno = await wallet.getSeqno();

    // send the request transaction
    const didIssuer = createDidIssuerContract(contractInfo.address);
    const didIssuerContract = client.open(didIssuer);
    await didIssuerContract.sendRequest(account, sender);

    // wait until confirmed
    let currentSeqno = seqno;
    while (currentSeqno == seqno) {
        console.log('waiting for request transaction to confirm...');
        await sleep(1500);
        currentSeqno = await wallet.getSeqno();
    }
    console.log('Request transaction confirmed!');
}
