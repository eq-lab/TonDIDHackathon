#### Create TON testnet wallet
1. Install [OpenMask](https://chrome.google.com/webstore/detail/openmask/penjlddjkjgpnkllboccdgccekpkcbin?utm_source=openmask) to Chrome
2. Open it, switch to testnet, copy mnemonic
3. Request tokens to your address here: https://t.me/testgiver_ton_bot
4. Send 0.0001 TON to a random address to activate your wallet
5. Replace mnemonic in `index.ts` file


#### Compile FunC contract
```bash
npx func-js contracts/func-lib/stdlib.fc contracts/counter.fc --boc bin/counter.cell
```
#### Generate boc from fift script
```bash
fift -Icontracts/fift-lib -s contracts/externalIncrement.fif EQCqzqAl5Yg4sj0jk5BcX8qg24cunlsOs_2xPHJ-xwwqejhM 1 5
```

#### Deploy, read state, internalCall method
```bash
yarn install
yarn build && yarn start
``` 
