import { TonClient } from 'ton';
import { AccountState, createDidIssuerContract } from '@did-issuer/contracts/dist/common/index.js';

export async function readAccState(client: TonClient, contractAddress: string, account: string) {
    console.log(`\nRead acc state`);
    const didIssuerContract = await createDidIssuerContract(contractAddress);
    const didIssuer = client.open(didIssuerContract);

    const state = await didIssuer.getAccountState(account);
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
