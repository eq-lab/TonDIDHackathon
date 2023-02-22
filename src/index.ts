import {deploy} from "./deploy";
import {readState} from "./readState";
import {Dictionary} from "ton-core";
import yargs, {Argv} from "yargs";
import {createDeployment, createTonClient} from "./utils/common";

async function main(){
    let argv = yargs
        .command('deploy', "Deploy the KYC contract.", (yargs: Argv) =>
            yargs.option('seqno', {
                describe: "Initial seqno value",
                alias: 's',
                default: 1,
            }).option('provider', {
                describe: "Public key of KYC provider",
                alias: 'p',
                default: "0xc0681cb4375e11e6b2f75ff84e875c6ae02aea67d28f85c9ab2f2bb8ec382e69"
            }).option('fee', {
                describe: "Fee amount in TON coins",
                alias: 'f',
                default: 0.01,
            }).option('accounts', {
                describe: "Already KYC-passed accounts. Format: [[address_0,boolean_0],..,[address_N,boolean_N]]",
                alias: 'a',
                default: "[]",
            }).option('mnemonic', {
                describe: "Mnemonic for signer acc",
                alias: 'm',
                default: "casino trouble angle nature rigid describe lava angry cradle announce keep blanket what later public question master smooth mask visa salt middle announce gentle",
            }).option('name', {
                describe: "Contract name for fast searching",
                alias: 'n',
                type: 'string',
                required: true
            }), async ({name, seqno, provider, fee, accounts, mnemonic}) => {
                // todo: fill dict
                // console.log(name, seqno, provider, fee, accounts, mnemonic)
                const client = await createTonClient({network: 'testnet'});
                await deploy(client, name, mnemonic, seqno, provider, fee, Dictionary.empty());
            })
        .command('read-state', "Read state of KYC contract.", (yargs: Argv) =>
            yargs.option('name', {
                describe: "Contract name",
                alias: 'n',
                type: 'string'
            }).option('address', {
                describe: "Base64-url address of KYC provider",
                alias: 'a',
                type: 'string'
            }), async ({name, address}) => {
            if (name === undefined && address === undefined) {
                throw '--name or --address must be presented!'
            }
            const deployment = createDeployment();
            let contractInfo;
            if (name !== undefined) {
                contractInfo = deployment.getContractWithName(name)
            }
            if (address !== undefined) {
                contractInfo = deployment.getContractWithAddress(address)
            }
            if (contractInfo === undefined) {
                throw 'unknown contract'
            }
            const client = await createTonClient({network: 'testnet'});
            await readState(client, contractInfo.address);
        });
    argv.parse();
}

main()