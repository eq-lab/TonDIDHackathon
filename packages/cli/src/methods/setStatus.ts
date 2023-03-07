import { TonClient } from 'ton';
import { mnemonicToWalletKey } from 'ton-crypto';
import { createKycContract } from '@kyc/contracts/dist/common/index.js';
import { parseAccountState } from '../common';

export async function setStatus(
    client: TonClient,
    contractAddress: string,
    mnemonic: string,
    domain: string,
    statusStr: string
) {
    console.log(`\nSetting new status`);
    const kycContract = await createKycContract(contractAddress);
    const kyc = client.open(kycContract);
    const provider = await mnemonicToWalletKey(mnemonic.split(' '));
    const status = parseAccountState(statusStr);
    if (status === undefined) {
        throw new Error('wrong account status');
    }

    await kyc.sendSetAccState(provider, domain, status);
}
