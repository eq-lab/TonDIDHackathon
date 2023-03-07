import { useEffect, useState } from 'react';
import { useTonClient } from './useTonClient';
import { useAsyncInitialize } from './useAsyncInitialize';
import { useTonConnect } from './useTonConnect';
import { Address } from 'ton-core';
import { Kyc } from '@kyc/contracts/dist/wrappers/kyc.js';
import { AccountState } from '@kyc/contracts/dist/common/index.js';

export function useKycContract() {
    const client = useTonClient();
    const [domainName, setDomainName] = useState<string | undefined>();
    const [accountState, setAccountState] = useState<AccountState | undefined>();
    const [kycContractAddress, setKycContractAddress] = useState<string>('');
    const { sender } = useTonConnect();

    const fetchState = async (): Promise<void> => {
        if (!kycContract) return;
        if (!domainName) return;
        setAccountState(undefined);
        if (!domainName.endsWith('.ton')) {
            return;
        }
        const state = await kycContract.getAccountState(domainName);
        setAccountState(state);
    };

    const kycContract = useAsyncInitialize(async () => {
        if (!client) return;
        if (kycContractAddress === '') return;
        const contract = new Kyc(Address.parse(kycContractAddress));
        console.log(`Contract was selected. Address: ${kycContractAddress}`);
        return client.open(contract);
    }, [client, kycContractAddress]);

    useEffect(() => {
        fetchState();
    }, [domainName]);

    return {
        accountState,
        kycContractAddress,
        setKycContractAddress,
        domainName,
        setDomainName: (domainName: string) => {
            setDomainName(domainName.toLowerCase());
        },
        fetchState,
        sendRequest: () => {
            if (!domainName) return;
            return kycContract?.sendRequestKyc(domainName, sender);
        },
    };
}
