import { TonClient } from 'ton';
import {
    AccountsDictionary,
    ContractInfo,
    createDeployment,
    createKycForDeploy,
    createWalletContract,
    sleep,
} from '../common';
import { mnemonicToWalletKey } from 'ton-crypto';

export async function request(client: TonClient, contractInfo: ContractInfo, mnemonic: string, accounts: string) {
    console.log(`\nRequest`);
    // TODO
    // const deployment = createDeployment();
    // const kyc = createKycForDeploy(initialSeqno, kycProvider, fee, accounts);
    // if (deployment.getContractWithName(contractName) !== undefined) {
    //     throw 'contract with this name already deployed!';
    // }
    // // exit if contract is already deployed
    // console.log('contract address:', kyc.address.toString());
    // if (await client.isContractDeployed(kyc.address)) {
    //     throw 'Contract already deployed!';
    // }
    //
    // const key = await mnemonicToWalletKey(mnemonic.split(' '));
    // const walletContract = await createWalletContract(client, key);
    // const wallet = client.open(walletContract);
    // const sender = wallet.sender(key.secretKey);
    //
    // const seqno = await wallet.getSeqno();
    //
    // // send the deploy transaction
    // const kycContract = client.open(kyc);
    // await kycContract.sendDeploy(sender);
    //
    // // wait until confirmed
    // let currentSeqno = seqno;
    // while (currentSeqno == seqno) {
    //     console.log('waiting for deploy transaction to confirm...');
    //     await sleep(1500);
    //     currentSeqno = await wallet.getSeqno();
    // }
    // console.log('deploy transaction confirmed!');
    // deployment.pushContract({ workchain: 0, name: contractName, address: kyc.address.toString() });
}
