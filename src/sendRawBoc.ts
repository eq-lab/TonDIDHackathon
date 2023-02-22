import {getHttpEndpoint} from "@orbs-network/ton-access";
import {Address, Cell, TonClient} from "ton";
import { Kyc } from "./kyc";
import fs from "fs";
import {createKycContract} from "./utils/common";

export async function sendRawBoc(client: TonClient, filename: string) {
    console.log(`\nSend raw boc`);
    const externalMessage = Cell.fromBoc(fs.readFileSync(filename))[0]; // compilation output from step 6
    await client.sendFile(externalMessage.toBoc())
}

