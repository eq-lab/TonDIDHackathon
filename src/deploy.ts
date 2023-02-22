import * as fs from "fs";
import {TonClient, Cell} from "ton";
import { Kyc } from "./kyc";
import { Dictionary } from "ton-core";
import {createDeployment, createWalletContract, sleep} from "./utils/common";
import {mnemonicToWalletKey} from "ton-crypto"; // this is the interface class from step 7

export async function deploy(
    client: TonClient,
    contractName: string,
    mnemonic: string,
    initialSeqno: number,
    kycProvider: string,
    fee: number,
    accounts: Dictionary<number, boolean>
) {
    console.log(`\nDeploy`);
    const deployment = createDeployment();

    // prepare Counter's initial code and data cells for deployment
    const kycCode = Cell.fromBoc(fs.readFileSync("bin/kyc.cell"))[0]; // compilation output from step 6

    const counter = Kyc.createForDeploy(kycCode, initialSeqno, kycProvider, fee, accounts);

    // exit if contract is already deployed
    console.log("contract address:", counter.address.toString());
    if (await client.isContractDeployed(counter.address)) {
        return console.log("Contract already deployed");
    }

    const key = await mnemonicToWalletKey(mnemonic.split(" "));
    const walletContract = await createWalletContract(client, key);
    const wallet = client.open(walletContract);
    const sender = wallet.sender(key.secretKey);

    const seqno = await wallet.getSeqno();

    // send the deploy transaction
    const counterContract = client.open(counter);
    await counterContract.sendDeploy(sender);

    // wait until confirmed
    let currentSeqno = seqno;
    while (currentSeqno == seqno) {
        console.log("waiting for deploy transaction to confirm...");
        await sleep(1500);
        currentSeqno = await wallet.getSeqno();
    }
    console.log("deploy transaction confirmed!");
    deployment.pushContract({ workchain: 0, name: contractName, address: counter.address.toString()});
}
