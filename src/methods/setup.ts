import { TonClient } from 'ton';
import { mnemonicToWalletKey } from 'ton-crypto';
import { convertGramToNum, createKycContract } from '../common';

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

    const fee = newFee !== undefined ? newFee! : convertGramToNum(await kyc.getFee());
    await kyc.sendSetup(provider, newProvider, fee);
}
