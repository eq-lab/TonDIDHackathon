import { useState } from 'react';
import { useTonClient } from './useTonClient';
import { useAsyncInitialize } from './useAsyncInitialize';
import { useTonConnect } from './useTonConnect';
import { Address } from 'ton-core';
import { DidIssuer } from '@did-issuer/contracts/dist/wrappers/DidIssuer.js';
import { AccountsDictionary, AccountState, createAccountsDictionary } from '@did-issuer/contracts/dist/common/index.js';

export function useDidIssuerContract() {
    const client = useTonClient();
    const [accountsStates, setAccountsStates] = useState<AccountsDictionary>(createAccountsDictionary());
    const [domainName, setDomainName] = useState<string | undefined>();
    const [accountState, setAccountState] = useState<AccountState | undefined>();
    const [requestFee, setRequestFee] = useState<bigint | undefined>();
    const [seqno, setSeqno] = useState<bigint | undefined>();
    const [providerPublicKey, setProviderPublicKey] = useState<string | undefined>();
    const [didIssuerContractAddress, setDidIssuerContractAddress] = useState<string>('');
    const { sender } = useTonConnect();

    const fetchAccountState = async (): Promise<void> => {
        setAccountState(undefined);
        if (!didIssuerContract) return;
        if (!domainName) return;
        if (!domainName.endsWith('.ton')) {
            return;
        }
        const state = await didIssuerContract.getAccountState(domainName);
        setAccountState(state);
    };

    const fetchContractState = async (): Promise<void> => {
        if (!didIssuerContract) return;
        setRequestFee(undefined);
        setProviderPublicKey(undefined);
        setSeqno(undefined);
        setAccountState(undefined);

        Promise.all([
            didIssuerContract.getAccountsData(),
            didIssuerContract.getFee(),
            didIssuerContract.getProvider(),
            didIssuerContract.getSeqno(),
        ]).then(([accounts, fee, provider, actualSeqno]) => {
            setAccountsStates(accounts);
            setRequestFee(fee);
            setProviderPublicKey(provider);
            setSeqno(actualSeqno);
        });
    };

    const didIssuerContract = useAsyncInitialize(async () => {
        if (!client) return;
        if (didIssuerContractAddress === '') return;
        const contract = new DidIssuer(Address.parse(didIssuerContractAddress));
        console.log(`Contract was selected. Address: ${didIssuerContractAddress}`);
        const didIssuer = client.open(contract);
        Promise.all([
            didIssuer.getAccountsData(),
            didIssuer.getFee(),
            didIssuer.getProvider(),
            didIssuer.getSeqno(),
        ]).then(([accounts, fee, provider, actualSeqno]) => {
            setAccountsStates(accounts);
            setRequestFee(fee);
            setProviderPublicKey(provider);
            setSeqno(actualSeqno);
        });
        return didIssuer;
    }, [client, didIssuerContractAddress]);

    // useEffect(() => {
    //     fetchAccountState();
    // }, [domainName]);

    return {
        accountsStates,
        accountState,
        didIssuerContractAddress,
        setDidIssuerContractAddress,
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
            return didIssuerContract?.sendRequest(domainName, sender);
        },
    };
}
