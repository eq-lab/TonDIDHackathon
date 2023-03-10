import { TonClient } from 'ton';
import { mnemonicToWalletKey } from 'ton-crypto';
import {
    convertGramToNum,
    convertPublickKeyStringToBuffer,
    createDidIssuerContract,
} from '@did-issuer/contracts/dist/common/index.js';

export async function setup(
    client: TonClient,
    contractAddress: string,
    mnemonic: string,
    newProviderPublicKey: string | undefined,
    newFee: number | undefined
) {
    console.log(`\nSetting up`);
    const didIssuerContract = await createDidIssuerContract(contractAddress);
    const didIssuer = client.open(didIssuerContract);
    const provider = await mnemonicToWalletKey(mnemonic.split(' '));

    const newProvider = newProviderPublicKey !== undefined ? newProviderPublicKey! : provider.publicKey.toString('hex');

    // throws error if newProvider string is wrong
    convertPublickKeyStringToBuffer(newProvider);

    const fee = newFee !== undefined ? newFee! : convertGramToNum(await didIssuer.getFee());
    await didIssuer.sendSetup(provider, newProvider, fee);
}
