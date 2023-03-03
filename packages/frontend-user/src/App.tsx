import '@twa-dev/sdk';
import './App.css';
import { TonConnectButton } from '@tonconnect/ui-react';
import { useTonConnect } from './hooks/useTonConnect';
import { useKycContract } from './hooks/useKycContract';
import { reduceAddress, stateToString } from './common';
import Deployment from '../../contracts/data/deployment.json';
import { ContractInfo } from '@kyc/contracts/dist/common';

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
