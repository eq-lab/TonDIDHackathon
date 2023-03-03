import { useEffect, useState } from 'react';
import { useTonClient } from './useTonClient';
import { useAsyncInitialize } from './useAsyncInitialize';
import { useTonConnect } from './useTonConnect';
import { Address } from 'ton-core';
import { Kyc } from '@kyc/contracts/kyc';
import { AccountState } from '../common';

export function useKycContract() {
    const client = useTonClient();
    const [domainName, setDomainName] = useState<string | undefined>();
    const [accountState, setAccountState] = useState<AccountState | undefined>();
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
        const contract = new Kyc(
            Address.parse('EQBclHN5ORKnEuBdOKliHA1VwCJZsBgd-O_ulbR4PbVSpjH3') // replace with your address from tutorial 2 step 8
        );
        return client.open(contract);
    }, [client]);

    useEffect(() => {
        fetchState();
    }, [domainName]);

    return {
        accountState,
        kycContractAddress: kycContract?.address.toString(),
        domainName,
        setDomainName: (domainName: string) => {
            setDomainName(domainName.toLowerCase());
        },
        fetchState,
        sendRequest: () => {
            if (!domainName) return;
            //@ts-ignore
            return kycContract?.sendRequestKyc(domainName, sender);
        },
    };
}
