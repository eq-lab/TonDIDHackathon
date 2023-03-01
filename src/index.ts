import { deploy } from './methods/deploy';
import { readState } from './methods/readState';
import { setup } from './methods/setup';
import yargs, { Argv } from 'yargs';
import {
    AccountState,
    createAccountsDictionary,
    createDeployment,
    createKycContract,
    createTonClient,
    decodeDomainName,
} from './common';
import { request } from './methods/request';
import { readAccState } from './methods/readAccState';

async function main() {
    let argv = yargs
        .command(
            'deploy',
            'Deploy the KYC contract.',
            (yargs: Argv) =>
                yargs
                    .option('seqno', {
                        describe: 'Initial seqno value',
                        alias: 's',
                        default: 1,
                    })
                    .option('provider', {
                        describe: 'Public key of KYC provider',
                        alias: 'p',
                        default: '0x0f52adfb686efdf38c28c1009af9efcd11b9a5ae186f5d8b8e62ab9065052c97',
                    })
                    .option('fee', {
                        describe: 'Fee amount in TON coins',
                        alias: 'f',
                        default: 0.01,
                    })
                    .option('accounts', {
                        describe: 'Already KYC-passed accounts. Format: address_0,address_1,address_N',
                        alias: 'a',
                        type: 'string',
                    })
                    .option('mnemonic', {
                        describe: 'Mnemonic for signer acc',
                        alias: 'm',
                        default:
                            'casino trouble angle nature rigid describe lava angry cradle announce keep blanket what later public question master smooth mask visa salt middle announce gentle',
                    })
                    .option('name', {
                        describe: 'Contract name for fast searching',
                        alias: 'n',
                        type: 'string',
                        required: true,
                    }),
            async ({ name, seqno, provider, fee, accounts, mnemonic }) => {
                let initDict = createAccountsDictionary();
                if (accounts !== undefined) {
                    const accs: [string, AccountState][] = accounts.split(',').map((x) => [x, AccountState.Approved]);
                    initDict = createAccountsDictionary(accs);
                }
                const client = await createTonClient({ network: 'testnet' });
                let providerPublicKey = provider;
                if (provider.startsWith('0x')) {
                    providerPublicKey = provider.slice(2);
                }
                const providerBuffer = Buffer.from(providerPublicKey, 'hex');
                if (providerBuffer.length != 32) {
                    throw `incorrect provider public key length! Expected: 32, actual: ${providerBuffer.length}`;
                }
                await deploy(client, name, mnemonic, seqno, providerBuffer, fee, initDict);
            }
        )
        .command(
            'read-state',
            'Read state of KYC contract.',
            (yargs: Argv) =>
                yargs
                    .option('name', {
                        describe: 'Contract name',
                        alias: 'n',
                        type: 'string',
                    })
                    .option('address', {
                        describe: 'Base64-url address of KYC provider',
                        alias: 'a',
                        type: 'string',
                    }),
            async ({ name, address }) => {
                if (name === undefined && address === undefined) {
                    throw '--name or --address must be presented!';
                }
                if (name !== undefined && address !== undefined) {
                    throw 'only one of --name or --address must be presented!';
                }
                const deployment = createDeployment();
                let contractInfo;
                if (name !== undefined) {
                    contractInfo = deployment.getContractWithName(name);
                }
                if (address !== undefined) {
                    contractInfo = deployment.getContractWithAddress(address);
                }
                if (contractInfo === undefined) {
                    throw 'unknown contract';
                }
                const client = await createTonClient({ network: 'testnet' });
                await readState(client, contractInfo.address);
            }
        )
        .command(
            'read-acc-state',
            'Read state of account.',
            (yargs: Argv) =>
                yargs
                    .option('name', {
                        describe: 'Contract name',
                        alias: 'n',
                        type: 'string',
                    })
                    .option('address', {
                        describe: 'Base64-url address of KYC provider',
                        alias: 'a',
                        type: 'string',
                    })
                    .option('account', {
                        describe: 'TON Domain name',
                        alias: 'd',
                        type: 'string',
                        required: true,
                    }),
            async ({ name, address, account }) => {
                if (name === undefined && address === undefined) {
                    throw '--name or --address must be presented!';
                }
                if (name !== undefined && address !== undefined) {
                    throw 'only one of --name or --address must be presented!';
                }
                const deployment = createDeployment();
                let contractInfo;
                if (name !== undefined) {
                    contractInfo = deployment.getContractWithName(name);
                }
                if (address !== undefined) {
                    contractInfo = deployment.getContractWithAddress(address);
                }
                if (contractInfo === undefined) {
                    throw 'unknown contract';
                }
                const client = await createTonClient({ network: 'testnet' });
                await readAccState(client, contractInfo.address, account);
            }
        )
        .command(
            'setup',
            'Sets up provider and fee params of KYC contract',
            (yargs: Argv) =>
                yargs
                    .option('name', {
                        describe: 'Contract name',
                        alias: 'n',
                        type: 'string',
                    })
                    .option('address', {
                        describe: 'Base64-url address of KYC provider',
                        alias: 'a',
                        type: 'string',
                    })
                    .option('mnemonic', {
                        describe: 'Mnemonic for signer acc',
                        alias: 'm',
                        default:
                            'casino trouble angle nature rigid describe lava angry cradle announce keep blanket what later public question master smooth mask visa salt middle announce gentle',
                    })
                    .option('provider', {
                        describe: 'new KYC provider public key',
                        alias: 'p',
                        type: 'string',
                    })
                    .option('fee', {
                        describe: 'new fee amount',
                        alias: 'f',
                        type: 'string',
                    }),
            async ({ name, address, mnemonic, provider, fee }) => {
                if (name === undefined && address === undefined) {
                    throw '--name or --address must be presented!';
                }
                if (name !== undefined && address !== undefined) {
                    throw 'only one of --name or --address must be presented!';
                }
                if (provider === undefined && fee === undefined) {
                    throw '--provider or --fee must be presented!';
                }
                const deployment = createDeployment();
                let contractInfo;
                if (name !== undefined) {
                    contractInfo = deployment.getContractWithName(name);
                }
                if (address !== undefined) {
                    contractInfo = deployment.getContractWithAddress(address);
                }
                if (contractInfo === undefined) {
                    throw 'unknown contract';
                }

                const client = await createTonClient({ network: 'testnet' });
                await setup(client, contractInfo.address, mnemonic, provider, fee);
            }
        )
        .command(
            'send-request',
            'Request KYC for a new domain name.',
            (yargs: Argv) =>
                yargs
                    .option('account', {
                        describe: 'TON Domain name',
                        alias: 'd',
                        type: 'string',
                        required: true,
                    })
                    .option('mnemonic', {
                        describe: 'Mnemonic for signer acc',
                        alias: 'm',
                        default:
                            'donkey similar else ramp cotton shift web rabbit fall scene sea position mouse drill wedding night grant remove winter pilot sweet dry flight world',
                    })
                    .option('name', {
                        describe: 'Contract name for fast searching',
                        alias: 'n',
                        type: 'string',
                        required: true,
                    })
                    .option('address', {
                        describe: 'Base64-url address of KYC provider',
                        alias: 'a',
                        type: 'string',
                    }),
            async ({ account, mnemonic, name, address }) => {
                if (name === undefined && address === undefined) {
                    throw '--name or --address must be presented!';
                }
                if (name !== undefined && address !== undefined) {
                    throw 'only one of --name or --address must be presented!';
                }
                const deployment = createDeployment();
                let contractInfo;
                if (name !== undefined) {
                    contractInfo = deployment.getContractWithName(name);
                }
                if (address !== undefined) {
                    contractInfo = deployment.getContractWithAddress(address);
                }
                if (contractInfo === undefined) {
                    throw 'unknown contract';
                }

                const client = await createTonClient({ network: 'testnet' });
                await request(client, contractInfo, mnemonic, account);
            }
        )
        .command(
            'read-requested',
            'Print all KYC-requested accounts',
            (yargs: Argv) =>
                yargs
                    .option('name', {
                        describe: 'Contract name for fast searching',
                        alias: 'n',
                        type: 'string',
                        required: true,
                    })
                    .option('address', {
                        describe: 'Base64-url address of KYC provider',
                        alias: 'a',
                        type: 'string',
                    }),
            async ({ name, address }) => {
                if (name === undefined && address === undefined) {
                    throw '--name or --address must be presented!';
                }
                if (name !== undefined && address !== undefined) {
                    throw 'only one of --name or --address must be presented!';
                }
                const deployment = createDeployment();
                let contractInfo;
                if (name !== undefined) {
                    contractInfo = deployment.getContractWithName(name);
                }
                if (address !== undefined) {
                    contractInfo = deployment.getContractWithAddress(address);
                }
                if (contractInfo === undefined) {
                    throw 'unknown contract';
                }
                const client = await createTonClient({ network: 'testnet' });

                const kycContract = await createKycContract(contractInfo.address);
                const kyc = client.open(kycContract);
                const accounts = await kyc.getAccountsData();
                const requestedAccounts: string[] = [];
                for (const [acc, state] of accounts) {
                    if (state === AccountState.Requested) {
                        requestedAccounts.push(decodeDomainName(acc));
                    }
                }
                console.log(`KYC-requested accounts (${requestedAccounts.length}):`);
                requestedAccounts.forEach((acc) => console.log(`  ${acc}`));
            }
        );
    argv.parse();
}

main();
