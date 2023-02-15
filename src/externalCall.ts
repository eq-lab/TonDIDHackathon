import { getHttpEndpoint } from "@orbs-network/ton-access";
import { mnemonicToWalletKey } from "ton-crypto";
import { TonClient, WalletContractV4, Address } from "ton";
import Counter from "./Counter"; // this is the interface class we just implemented

export async function externalCall(contractAddress: string) {
    console.log(`\nExternal call`);
    // initialize ton rpc client on testnet
    const endpoint = await getHttpEndpoint({ network: "testnet" });
    const client = new TonClient({ endpoint });


    // open Counter instance by address
    const counterAddress = Address.parse(contractAddress); // replace with your address from step 8
    const counter = new Counter(counterAddress);
    const counterContract = client.open(counter);

    const contractSeqno = await counterContract.getSeqno();
    // send the external increment transaction
    await counterContract.sendExternalIncrement(10);

    // wait until confirmed
    let currentSeqno = contractSeqno;
    while (currentSeqno == contractSeqno) {
        console.log("waiting for transaction to confirm...");
        await sleep(1500);
        currentSeqno = await counterContract.getSeqno();
    }
    console.log("transaction confirmed!");
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
