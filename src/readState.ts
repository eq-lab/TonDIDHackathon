import { TonClient } from 'ton';
import { convertGramToNum, createKycContract } from './utils/common';

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
    // accounts.
    //     .loadDict<string, number>()
    console.log(`accounts = ${3}`);
}
