import { TonClient } from 'ton';
import { mnemonicToWalletKey } from 'ton-crypto';
import {
    convertGramToNum,
    convertPublickKeyStringToBuffer,
    createKycContract,
} from '@kyc/contracts/dist/common/index.js';

export async function setup(
    client: TonClient,
    contractAddress: string,
    mnemonic: string,
    newProviderPublicKey: string | undefined,
    newFee: number | undefined
) {
    console.log(`\nSetting up`);
    const kycContract = await createKycContract(contractAddress);
    const kyc = client.open(kycContract);
    const provider = await mnemonicToWalletKey(mnemonic.split(' '));

    const newProvider = newProviderPublicKey !== undefined ? newProviderPublicKey! : provider.publicKey.toString('hex');

    // throws error if newProvider string is wrong
    convertPublickKeyStringToBuffer(newProvider);

    const fee = newFee !== undefined ? newFee! : convertGramToNum(await kyc.getFee());
    await kyc.sendSetup(provider, newProvider, fee);
}
