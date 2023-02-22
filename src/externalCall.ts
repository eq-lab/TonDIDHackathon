import { getHttpEndpoint } from "@orbs-network/ton-access";
import { mnemonicToWalletKey } from "ton-crypto";
import { TonClient, WalletContractV4, Address } from "ton";
import { Kyc } from "./kyc";
import {createKycContract} from "./utils/common"; // this is the interface class we just implemented

export async function externalCall(client: TonClient, contractAddress: string) {
    console.log(`\nExternal call`);
    const keyContract = createKycContract(contractAddress)
    const kyc = client.open(keyContract);

    // const contractSeqno = await counterContract.getSeqno();
    // // send the external increment transaction
    // await counterContract.sendExternal(10);
    //
    // // wait until confirmed
    // let currentSeqno = contractSeqno;
    // while (currentSeqno == contractSeqno) {
    //     console.log("waiting for transaction to confirm...");
    //     await sleep(1500);
    //     currentSeqno = await counterContract.getSeqno();
    // }
    // console.log("transaction confirmed!");
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
