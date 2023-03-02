import { TonClient } from 'ton';
import {
    AccountsDictionary,
    createDeployment,
    createKycForDeploy,
    createWalletContract,
    sleep,
} from '@kyc/contracts/common';
import { mnemonicToWalletKey } from 'ton-crypto';
import { kycContractFileName } from '../common';

export async function deploy(
    client: TonClient,
    contractName: string,
    mnemonic: string,
    initialSeqno: number,
    kycProvider: Buffer,
    fee: number,
    initialDeposit: number,
    accounts: AccountsDictionary
) {
    console.log(`\nDeploy`);
    const deployment = createDeployment();
    const kyc = createKycForDeploy(kycContractFileName, initialSeqno, kycProvider, fee, accounts);
    if (deployment.getContractWithName(contractName) !== undefined) {
        throw new Error('contract with this name already deployed!');
    }
    // exit if contract is already deployed
    console.log('contract address:', kyc.address.toString());
    if (await client.isContractDeployed(kyc.address)) {
        throw new Error('Contract already deployed!');
    }

    const key = await mnemonicToWalletKey(mnemonic.split(' '));
    const walletContract = await createWalletContract(client, key);
    const wallet = client.open(walletContract);
    const sender = wallet.sender(key.secretKey);

    const seqno = await wallet.getSeqno();

    // send the deploy transaction
    const kycContract = client.open(kyc);
    await kycContract.sendDeploy(sender, initialDeposit);

    // wait until confirmed
    let currentSeqno = seqno;
    while (currentSeqno == seqno) {
        console.log('waiting for deploy transaction to confirm...');
        await sleep(1500);
        currentSeqno = await wallet.getSeqno();
    }
    console.log('deploy transaction confirmed!');
    deployment.pushContract({ workchain: 0, name: contractName, address: kyc.address.toString() });
}
