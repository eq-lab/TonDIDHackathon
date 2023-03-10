import { TonClient } from 'ton';
import { mnemonicToWalletKey } from 'ton-crypto';
import { createDidIssuerContract } from '@did-issuer/contracts/dist/common/index.js';
import { parseAccountState } from '../common';

export async function setStatus(
    client: TonClient,
    contractAddress: string,
    mnemonic: string,
    domain: string,
    statusStr: string
) {
    console.log(`\nSetting new status`);
    const didIssuerContract = await createDidIssuerContract(contractAddress);
    const didIssuer = client.open(didIssuerContract);
    const provider = await mnemonicToWalletKey(mnemonic.split(' '));
    const status = parseAccountState(statusStr);
    if (status === undefined) {
        throw new Error('wrong account status');
    }

    await didIssuer.sendSetAccState(provider, domain, status);
}
