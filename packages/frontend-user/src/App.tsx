import React from 'react';
import './App.css';
// import '@twa-dev/sdk/react';
import { useTonConnect } from './hooks/useTonConnect';
import { useKycContract } from './hooks/useKycContract';
import { TonConnectButton } from '@tonconnect/ui-react';
import { AccountState, ContractInfo, convertGramToNum } from '@kyc/contracts/dist/common/index.js';
import { filterAccByState, reduceAddress, stateToString } from './common';
import Deployment from '@kyc/contracts/data/deployment.json';

function App() {
    const { connected } = useTonConnect();
    const {
        accountsStates,
        accountState,
        kycContractAddress,
        setKycContractAddress,
        domainName,
        setDomainName,
        requestFee,
        providerPublicKey,
        seqno,
        fetchAccountState,
        fetchContractState,
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
                    <button
                        style={{ marginLeft: '1rem' }}
                        disabled={kycContractAddress === ''}
                        onClick={() => navigator.clipboard.writeText(kycContractAddress)}
                    >
                        Copy
                    </button>
                </div>
                <div className="Card">
                    <b>Request fee</b>
                    <div>{requestFee !== undefined ? convertGramToNum(requestFee) : '-'}</div>
                </div>
                <div className="Card">
                    <b>KYC provider public key</b>
                    <br />
                    <a
                        style={{ marginLeft: '1rem' }}
                        onClick={() => navigator.clipboard.writeText('0x' + providerPublicKey)}
                    >
                        {providerPublicKey !== undefined ? '0x' + reduceAddress(providerPublicKey) : '-'}
                    </a>
                </div>
                <div className="Card">
                    <b>seqno</b>
                    <div>{seqno !== undefined ? seqno.toString(10) : '-'}</div>
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
                    className={`Button ${domainName !== undefined ? 'Active' : 'Disabled'}`}
                    onClick={() => {
                        fetchAccountState();
                    }}
                >
                    Fetch account state
                </a>
                <a
                    className={`Button Active`}
                    onClick={() => {
                        fetchContractState();
                    }}
                >
                    Fetch contract state
                </a>
                <a
                    className={`Button ${connected && accountState === 0 ? 'Active' : 'Disabled'}`}
                    onClick={() => {
                        sendRequest();
                    }}
                >
                    Send KYC request
                </a>
                <h3>List of requested accounts:</h3>
                {filterAccByState(accountsStates, AccountState.Requested).map((x) => (
                    // <div key={`requested-${x}`}>{x}</div>
                    <p key={`requested-${x}`}>{x}</p>
                ))}
                <h3>List of approved accounts:</h3>
                {filterAccByState(accountsStates, AccountState.Approved).map((x) => (
                    <p key={`approved-${x}`}>{x}</p>
                ))}
                <h3>List of declined accounts:</h3>
                {filterAccByState(accountsStates, AccountState.Declined).map((x) => (
                    <p key={`declined-${x}`}>{x}</p>
                ))}
                <br />
            </div>
        </div>
    );
}

export default App;
