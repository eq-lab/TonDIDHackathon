import { TonClient } from 'ton';
import { AccountState, convertGramToNum, createKycContract } from '../common';

export async function readAccState(client: TonClient, contractAddress: string, account: string) {
    console.log(`\nRead acc state`);
    const kycContract = await createKycContract(contractAddress);
    const kyc = client.open(kycContract);

    const state = await kyc.getAccountState(account);
    let st = '';
    if (state == AccountState.Requested) {
        st = 'Requested';
    } else if (state == AccountState.Approved) {
        st = 'Approved';
    } else if (state == AccountState.Declined) {
        st = 'Declined';
    } else {
        st = 'Unknown';
    }

    console.log(`Account: ${account}, state: ${st}`);
}
