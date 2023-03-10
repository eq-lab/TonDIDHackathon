import { TonClient } from 'ton';
import {
    AccountsDictionary,
    createDeployment,
    createDidIssuerForDeploy,
    createWalletContract,
    sleep,
} from '@did-issuer/contracts/dist/common/index.js';
import { mnemonicToWalletKey } from 'ton-crypto';
import { deploymentPath, didIssuerContractFileName } from '../common';

export async function deploy(
    client: TonClient,
    contractName: string,
    mnemonic: string,
    initialSeqno: number,
    didProvider: Buffer,
    fee: number,
    initialDeposit: number,
    accounts: AccountsDictionary
) {
    console.log(`\nDeploy`);
    const deployment = createDeployment(deploymentPath);
    const didIssuer = createDidIssuerForDeploy(didIssuerContractFileName, initialSeqno, didProvider, fee, accounts);
    if (deployment.getContractWithName(contractName) !== undefined) {
        throw new Error('contract with this name already deployed!');
    }
    // exit if contract is already deployed
    console.log('contract address:', didIssuer.address.toString());
    if (await client.isContractDeployed(didIssuer.address)) {
        throw new Error('Contract already deployed!');
    }

    const key = await mnemonicToWalletKey(mnemonic.split(' '));
    const walletContract = await createWalletContract(client, key);
    const wallet = client.open(walletContract);
    const sender = wallet.sender(key.secretKey);

    const seqno = await wallet.getSeqno();

    // send the deploy transaction
    const didIssuerContract = client.open(didIssuer);
    await didIssuerContract.sendDeploy(sender, initialDeposit);

    // wait until confirmed
    let currentSeqno = seqno;
    while (currentSeqno == seqno) {
        console.log('waiting for deploy transaction to confirm...');
        await sleep(1500);
        currentSeqno = await wallet.getSeqno();
    }
    console.log('deploy transaction confirmed!');
    deployment.pushContract({ workchain: 0, name: contractName, address: didIssuer.address.toString() });
}
