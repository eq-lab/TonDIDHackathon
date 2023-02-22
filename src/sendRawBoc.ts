import { Cell, TonClient } from 'ton';
import fs from 'fs';

export async function sendRawBoc(client: TonClient, filename: string) {
    console.log(`\nSend raw boc`);
    const externalMessage = Cell.fromBoc(fs.readFileSync(filename))[0]; // compilation output from step 6
    await client.sendFile(externalMessage.toBoc());
}
