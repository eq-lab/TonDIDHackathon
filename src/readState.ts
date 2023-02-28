import { TonClient } from 'ton';
import { AccountState, convertGramToNum, createKycContract } from './utils/common';

export async function readState(client: TonClient, contractAddress: string) {
    console.log(`\nRead state`);
    const kycContract = await createKycContract(contractAddress);
    const kyc = client.open(kycContract);

    const kycProvider = await kyc.getProvider();
    console.log(`kycProvider = ${kycProvider}`);

    const feeValue = await kyc.getFee();
    console.log(`fee = ${convertGramToNum(feeValue)}`);

    const seqnoValue = await kyc.getSeqno();
    console.log(`seqno = ${seqnoValue.toString()}`);

    const accounts = await kyc.getAccountsData();
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
