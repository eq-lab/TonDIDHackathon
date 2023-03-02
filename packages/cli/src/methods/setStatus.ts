import { TonClient } from 'ton';
import { mnemonicToWalletKey } from 'ton-crypto';
import { AccountState, createKycContract } from '@kyc/contracts/common';

export async function setStatus(
    client: TonClient,
    contractAddress: string,
    mnemonic: string,
    domain: string,
    statusNumber: number
) {
    console.log(`\nSetting new status`);
    const kycContract = await createKycContract(contractAddress);
    const kyc = client.open(kycContract);
    const provider = await mnemonicToWalletKey(mnemonic.split(' '));

    const status = AccountState[statusNumber];
    if (status === undefined) {
        throw 'wrong status number';
    }

    await kyc.sendSetAccState(provider, domain, statusNumber);
}
