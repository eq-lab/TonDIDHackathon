import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient, Address } from "ton";
import Counter from "./kyc";
import Kyc from "./kyc";
import {convertGramToNum, convertNumToGram} from "./utils/common"; // this is the interface class we just implemented

export async function readState(contractAddress: string) {
    console.log(`\nRead state`)
    // initialize ton rpc client on testnet
    const endpoint = await getHttpEndpoint({ network: "testnet" });
    const client = new TonClient({ endpoint });

    // open Counter instance by address
    const counterAddress = Address.parse(contractAddress); // replace with your address from step 8
    const kyc = new Kyc(counterAddress);
    const kycContract = client.open(kyc);

    // call the getter on chain
    const kycProvider = await kycContract.getProvider();
    console.log(`kycProvider = 0x${kycProvider.toString(16)}`);

    const feeValue = await kycContract.getFee();
    console.log(`fee = ${convertGramToNum(feeValue)}`);

    const seqnoValue = await kycContract.getSeqno();
    console.log(`seqno = ${seqnoValue.toString()}`);

    const accounts = await kycContract.getSeqno();
    console.log(`seqno = ${seqnoValue.toString()}`);
}
