import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient, Address } from "ton";
import Counter from "./kyc"; // this is the interface class we just implemented

export async function readState(contractAddress: string) {
    console.log(`\nRead state`)
    // initialize ton rpc client on testnet
    const endpoint = await getHttpEndpoint({ network: "testnet" });
    const client = new TonClient({ endpoint });

    // open Counter instance by address
    const counterAddress = Address.parse(contractAddress); // replace with your address from step 8
    const counter = new Counter(counterAddress);
    const counterContract = client.open(counter);

    // call the getter on chain
    const kycProvider = await counterContract.getProvider();
    console.log("kycProvider =", kycProvider.toString());

    const feeValue = await counterContract.getFee();
    console.log("fee =", feeValue.toString());

    const seqnoValue = await counterContract.getSeqno();
    console.log("seqno =", seqnoValue.toString());
}
