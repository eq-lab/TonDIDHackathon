import * as fs from "fs";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { mnemonicToWalletKey } from "ton-crypto";
import {TonClient, Cell, WalletContractV4, Address} from "ton";
import Counter from "./kyc";
import Kyc from "./kyc";
import {Dictionary} from "ton-core";
import {createDeployment} from "./utils/common"; // this is the interface class from step 7

export async function deploy(
    contractName: string,
    mnemonic: string,
    initialSeqno: number,
    kycProvider: string,
    fee: number,
    accounts: Dictionary<number, boolean>
) {
    console.log(`\nDeploy`);
    const deployment = createDeployment();
    // initialize ton rpc client on testnet
    const endpoint = await getHttpEndpoint({ network: "testnet" });
    const client = new TonClient({ endpoint });

    // prepare Counter's initial code and data cells for deployment
    const kycCode = Cell.fromBoc(fs.readFileSync("bin/kyc.cell"))[0]; // compilation output from step 6

    const counter = Kyc.createForDeploy(kycCode, initialSeqno, kycProvider, fee, accounts);

    // exit if contract is already deployed
    console.log("contract address:", counter.address.toString());
    if (await client.isContractDeployed(counter.address)) {
        return console.log("Contract already deployed");
    }

    // open wallet v4 (notice the correct wallet version here)
    const key = await mnemonicToWalletKey(mnemonic.split(" "));
    const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
    if (!await client.isContractDeployed(wallet.address)) {
        return console.log("wallet is not deployed");
    }

    // open wallet and read the current seqno of the wallet
    const walletContract = client.open(wallet);
    const walletSender = walletContract.sender(key.secretKey);
    const seqno = await walletContract.getSeqno();

    // send the deploy transaction
    const counterContract = client.open(counter);
    await counterContract.sendDeploy(walletSender);

    // wait until confirmed
    let currentSeqno = seqno;
    while (currentSeqno == seqno) {
        console.log("waiting for deploy transaction to confirm...");
        await sleep(1500);
        currentSeqno = await walletContract.getSeqno();
    }
    console.log("deploy transaction confirmed!");
    deployment.pushContract({ workchain: 0, name: contractName, address: counter.address.toString()});
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
