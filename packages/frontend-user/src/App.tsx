import '@twa-dev/sdk';
import './App.css';
import { TonConnectButton } from '@tonconnect/ui-react';
import { useTonConnect } from './hooks/useTonConnect';
import { useKycContract } from './hooks/useKycContract';
import { stateToString } from './common';

function App() {
    const { connected } = useTonConnect();
    const { accountState, kycContractAddress, domainName, setDomainName, fetchState, sendRequest } = useKycContract();

    return (
        <div className="App">
            <div className="Container">
                <TonConnectButton />

                <div className="Card">
                    <b>KYC contract address</b>
                    <div className="Hint">{kycContractAddress?.slice(0, 30) + '...'}</div>
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
