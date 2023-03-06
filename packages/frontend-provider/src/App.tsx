import React from 'react';
import logo from './logo.svg';
import './App.css';
import '@twa-dev/sdk';
import { useTonConnect } from '@kyc/frontend-user/src/hooks/useTonConnect';
import { useKycContract } from '@kyc/frontend-user/src/hooks/useKycContract';
import { TonConnectButton } from '@tonconnect/ui-react';
import { ContractInfo } from '@kyc/contracts/common';
import { reduceAddress, stateToString } from '@kyc/frontend-user/src/common';
import Deployment from '@kyc/contracts/data/deployment.json';

function App() {
    const { connected } = useTonConnect();
    const {
        accountState,
        kycContractAddress,
        setKycContractAddress,
        domainName,
        setDomainName,
        fetchState,
        sendRequest,
    } = useKycContract();

    return (
        <div className="App">
            <div className="Container">
                <TonConnectButton />

                <div className="Card">
                    <b>KYC contract address</b>
                    <br />
                    <select
                        value={kycContractAddress}
                        defaultValue={''}
                        onChange={(e) => {
                            setKycContractAddress(e.currentTarget.value);
                        }}
                    >
                        <option value={''} disabled>
                            Select contract...
                        </option>
                        {(Deployment as ContractInfo[]).map((x) => (
                            <option key={`contract-${x.name}`} value={x.address}>{`${x.name} (${reduceAddress(
                                x.address
                            )})`}</option>
                        ))}
                    </select>
                </div>

                <div className="Card">
                    <b>TON Domain Name</b>
                    <br />
                    <input
                        value={domainName}
                        onChange={(e) => {
                            setDomainName(e.target.value);
                        }}
                    />
                </div>

                <div className="Card">
                    <b>KYC state</b>
                    <div>{accountState !== undefined ? stateToString(accountState) : '-'}</div>
                </div>

                <a
                    className={`Button ${domainName ? 'Active' : 'Disabled'}`}
                    onClick={() => {
                        fetchState();
                    }}
                >
                    Fetch state
                </a>

                <a
                    className={`Button ${connected && accountState === 0 ? 'Active' : 'Disabled'}`}
                    onClick={() => {
                        sendRequest();
                    }}
                >
                    Send KYC request
                </a>
            </div>
        </div>
    );
}

export default App;
