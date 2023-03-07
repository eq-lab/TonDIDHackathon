import yargs, { Argv } from 'yargs';
import { deploy } from './methods/deploy';
import { readState } from './methods/readState';
import { setup } from './methods/setup';
import { setStatus } from './methods/setStatus';
import { request } from './methods/request';
import { readAccState } from './methods/readAccState';
import {
    AccountState,
    convertPublickKeyStringToBuffer,
    createAccountsDictionary,
    createDeployment,
    createKycContract,
    createTonClient,
    decodeDomainName,
} from '@kyc/contracts/dist/common/index.js';
import { deploymentPath } from './common';

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
                    .option('deposit', {
                        describe: 'Initial deposit to contract in TON coins',
                        alias: 'd',
                        default: 0.5,
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
            async ({ name, seqno, provider, fee, deposit, accounts, mnemonic }) => {
                let initDict = createAccountsDictionary();
                if (accounts !== undefined) {
                    const accs: [string, AccountState][] = accounts.split(',').map((x) => [x, AccountState.Approved]);
                    initDict = createAccountsDictionary(accs);
                }
                const client = await createTonClient({ network: 'testnet' });
                let providerBuffer = convertPublickKeyStringToBuffer(provider);

                await deploy(client, name, mnemonic, seqno, providerBuffer, fee, deposit, initDict);
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
                    throw new Error('--name or --address must be presented!');
                }
                if (name !== undefined && address !== undefined) {
                    throw new Error('only one of --name or --address must be presented!');
                }
                const deployment = createDeployment(deploymentPath);
                let contractInfo;
                if (name !== undefined) {
                    contractInfo = deployment.getContractWithName(name);
                }
                if (address !== undefined) {
                    contractInfo = deployment.getContractWithAddress(address);
                }
                if (contractInfo === undefined) {
                    throw new Error('unknown contract');
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
                    throw new Error('--name or --address must be presented!');
                }
                if (name !== undefined && address !== undefined) {
                    throw new Error('only one of --name or --address must be presented!');
                }
                const deployment = createDeployment(deploymentPath);
                let contractInfo;
                if (name !== undefined) {
                    contractInfo = deployment.getContractWithName(name);
                }
                if (address !== undefined) {
                    contractInfo = deployment.getContractWithAddress(address);
                }
                if (contractInfo === undefined) {
                    throw new Error('unknown contract');
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
                        type: 'number',
                    }),
            async ({ name, address, mnemonic, provider, fee }) => {
                if (name === undefined && address === undefined) {
                    throw new Error('--name or --address must be presented!');
                }
                if (name !== undefined && address !== undefined) {
                    throw new Error('only one of --name or --address must be presented!');
                }
                if (provider === undefined && fee === undefined) {
                    throw new Error('--provider or --fee must be presented!');
                }
                const deployment = createDeployment(deploymentPath);
                let contractInfo;
                if (name !== undefined) {
                    contractInfo = deployment.getContractWithName(name);
                }
                if (address !== undefined) {
                    contractInfo = deployment.getContractWithAddress(address);
                }
                if (contractInfo === undefined) {
                    throw new Error('unknown contract');
                }

                const client = await createTonClient({ network: 'testnet' });
                await setup(client, contractInfo.address, mnemonic, provider, fee);
            }
        )
        .command(
            'set-status',
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
                    .option('domain', {
                        describe: 'domain to set new status',
                        alias: 'd',
                        type: 'string',
                    })
                    .option('status', {
                        describe: 'new status',
                        alias: 's',
                        type: 'number',
                    }),
            async ({ name, address, mnemonic, domain, status }) => {
                if (name === undefined && address === undefined) {
                    throw new Error('--name or --address must be presented!');
                }
                if (name !== undefined && address !== undefined) {
                    throw new Error('only one of --name or --address must be presented!');
                }
                if (domain === undefined) {
                    throw new Error('--domain must be presented!');
                }
                if (status === undefined) {
                    throw new Error('--status must be presented!');
                }
                const deployment = createDeployment(deploymentPath);
                let contractInfo;
                if (name !== undefined) {
                    contractInfo = deployment.getContractWithName(name);
                }
                if (address !== undefined) {
                    contractInfo = deployment.getContractWithAddress(address);
                }
                if (contractInfo === undefined) {
                    throw new Error('unknown contract');
                }

                const client = await createTonClient({ network: 'testnet' });
                await setStatus(client, contractInfo.address, mnemonic, domain, status);
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
                    throw new Error('--name or --address must be presented!');
                }
                if (name !== undefined && address !== undefined) {
                    throw new Error('only one of --name or --address must be presented!');
                }
                const deployment = createDeployment(deploymentPath);
                let contractInfo;
                if (name !== undefined) {
                    contractInfo = deployment.getContractWithName(name);
                }
                if (address !== undefined) {
                    contractInfo = deployment.getContractWithAddress(address);
                }
                if (contractInfo === undefined) {
                    throw new Error('unknown contract');
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
                    throw new Error('--name or --address must be presented!');
                }
                if (name !== undefined && address !== undefined) {
                    throw new Error('only one of --name or --address must be presented!');
                }
                const deployment = createDeployment(deploymentPath);
                let contractInfo;
                if (name !== undefined) {
                    contractInfo = deployment.getContractWithName(name);
                }
                if (address !== undefined) {
                    contractInfo = deployment.getContractWithAddress(address);
                }
                if (contractInfo === undefined) {
                    throw new Error('unknown contract');
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
