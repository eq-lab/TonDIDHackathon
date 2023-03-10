import { TonClient } from 'ton';
import { AccountState, convertGramToNum, createDidIssuerContract } from '@did-issuer/contracts/dist/common/index.js';

export async function readState(client: TonClient, contractAddress: string) {
    console.log(`\nRead state`);
    const didIssuerContract = await createDidIssuerContract(contractAddress);
    const didIssuer = client.open(didIssuerContract);

    const didProvider = await didIssuer.getProvider();
    console.log(`didProvider = ${didProvider}`);

    const feeValue = await didIssuer.getFee();
    console.log(`fee = ${convertGramToNum(feeValue)}`);

    const seqnoValue = await didIssuer.getSeqno();
    console.log(`seqno = ${seqnoValue.toString()}`);

    const accounts = await didIssuer.getAccountsData();
    let numOfRequested = 0;
    let numOfApproved = 0;
    let numOfDeclined = 0;
    for (const [, state] of accounts) {
        if (state == AccountState.Requested) {
            numOfRequested++;
        } else if (state == AccountState.Approved) {
            numOfApproved++;
        } else if (state == AccountState.Declined) {
            numOfDeclined++;
        }
    }

    console.log(`Accounts:`);
    console.log(`  Num of requests = ${numOfRequested}`);
    console.log(`  Num of approved = ${numOfApproved}`);
    console.log(`  Num of declined = ${numOfDeclined}`);
}
