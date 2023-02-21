import {deploy} from "./deploy";
import {readState} from "./readState";
import {internalCall} from "./internalCall";
import {externalCall} from "./externalCall";
import {sendRawBoc} from "./sendRawBoc";

async function main(){
    // open wallet v4 (notice the correct wallet version here)
    const mnemonic = "casino trouble angle nature rigid describe lava angry cradle announce keep blanket what later public question master smooth mask visa salt middle announce gentle"; // your 24 secret words (replace ... with the rest of the words)

    // await deploy(mnemonic)
    const contractAddress = 'kQBfZ8EMfLT8oS_dmIEYAs9QN53Vi_D25Lw0G9p-E_jOAXt-';

    await readState(contractAddress);
    // await internalCall(mnemonic, contractAddress);
    // await readState(contractAddress);

    await externalCall(contractAddress);
    await readState(contractAddress);

    // await sendRawBoc(contractAddress);
    // await readState(contractAddress);
}

main()