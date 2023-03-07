import { useEffect, useState } from 'react';
import { useTonClient } from './useTonClient';
import { useAsyncInitialize } from './useAsyncInitialize';
import { useTonConnect } from './useTonConnect';
import { Address } from 'ton-core';
import { Kyc } from '@kyc/contracts/dist/wrappers/kyc.js';
import { AccountsDictionary, AccountState, createAccountsDictionary } from '@kyc/contracts/dist/common/index.js';

export function useKycContract() {
    const client = useTonClient();
    const [accountsStates, setAccountsStates] = useState<AccountsDictionary>(createAccountsDictionary());
    const [domainName, setDomainName] = useState<string | undefined>();
    const [accountState, setAccountState] = useState<AccountState | undefined>();
    const [requestFee, setRequestFee] = useState<bigint | undefined>();
    const [seqno, setSeqno] = useState<bigint | undefined>();
    const [providerPublicKey, setProviderPublicKey] = useState<string | undefined>();
    const [kycContractAddress, setKycContractAddress] = useState<string>('');
    const { sender } = useTonConnect();

    const fetchAccountState = async (): Promise<void> => {
        setAccountState(undefined);
        if (!kycContract) return;
        if (!domainName) return;
        if (!domainName.endsWith('.ton')) {
            return;
        }
        const state = await kycContract.getAccountState(domainName);
        setAccountState(state);
    };

    const fetchContractState = async (): Promise<void> => {
        if (!kycContract) return;
        setRequestFee(undefined);
        setProviderPublicKey(undefined);
        setSeqno(undefined);
        setAccountState(undefined);

        Promise.all([
            kycContract.getAccountsData(),
            kycContract.getFee(),
            kycContract.getProvider(),
            kycContract.getSeqno(),
        ]).then(([accounts, fee, provider, actualSeqno]) => {
            setAccountsStates(accounts);
            setRequestFee(fee);
            setProviderPublicKey(provider);
            setSeqno(actualSeqno);
        });
    };

    const kycContract = useAsyncInitialize(async () => {
        if (!client) return;
        if (kycContractAddress === '') return;
        const contract = new Kyc(Address.parse(kycContractAddress));
        console.log(`Contract was selected. Address: ${kycContractAddress}`);
        const kyc = client.open(contract);
        Promise.all([kyc.getAccountsData(), kyc.getFee(), kyc.getProvider(), kyc.getSeqno()]).then(
            ([accounts, fee, provider, actualSeqno]) => {
                setAccountsStates(accounts);
                setRequestFee(fee);
                setProviderPublicKey(provider);
                setSeqno(actualSeqno);
            }
        );
        return kyc;
    }, [client, kycContractAddress]);

    // useEffect(() => {
    //     fetchAccountState();
    // }, [domainName]);

    return {
        accountsStates,
        accountState,
        kycContractAddress,
        setKycContractAddress,
        domainName,
        setDomainName: (domainName: string) => {
            setDomainName(domainName.toLowerCase());
        },
        requestFee,
        providerPublicKey,
        seqno,
        fetchAccountState,
        fetchContractState,
        sendRequest: () => {
            if (!domainName) return;
            return kycContract?.sendRequestKyc(domainName, sender);
        },
    };
}
