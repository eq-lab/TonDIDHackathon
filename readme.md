#### Create TON testnet wallet
1. Install [OpenMask](https://chrome.google.com/webstore/detail/openmask/penjlddjkjgpnkllboccdgccekpkcbin?utm_source=openmask) to Chrome
2. Open it, switch to testnet, copy mnemonic
3. Request tokens to your address here: https://t.me/testgiver_ton_bot
4. Send 0.0001 TON to a random address to activate your wallet
5. Replace mnemonic in `index.ts` file


#### Build fift interpretator on M1
1. Compile from source:
```bash
git clone https://github.com/ton-blockchain/ton.git
cd ton
git submodules init
git submodules update
brew install openssl
brew install gsl
brew install libmicrohttpd
brew install ninja
mkdir build
cd build
cmake -GNinja -DOPENSSL_FOUND=1 -DOPENSSL_INCLUDE_DIR=/opt/homebrew/opt/openssl@3/include -DOPENSSL_CRYPTO_LIBRARY=/opt/homebrew/opt/openssl@3/lib/libcrypto.a -DCMAKE_OSX_DEPLOYMENT_TARGET:STRING=13.1 -DCMAKE_CXX_FLAGS="-stdlib=libc++" -DCMAKE_BUILD_TYPE=Release ..
ninja fift
ninja func
ninja lite-client
```
2. Add `ton/build/crypto` to env

#### Compile FunC contract
```bash
npx func-js contracts/func-lib/stdlib.fc contracts/counter.fc --boc bin/counter.cell
```
#### Generate boc from fift script
```bash
fift -Icontracts/fift-lib -s contracts/externalIncrement.fif EQCqzqAl5Yg4sj0jk5BcX8qg24cunlsOs_2xPHJ-xwwqejhM 1 5
```

#### Deploy
```bash
yarn install
yarn build && yarn start deploy \
  --name 'test_contract'
``` 

#### Read state
```bash
yarn install
yarn build && yarn start read-state \
  --name 'test_contract'
``` 

#### toncli deploy
0. Install toncli:
```
pip3 install toncli
```
For alternative ways of installation you can see [toncli guide](https://github.com/disintar/toncli/blob/master/INSTALLATION.md)

1. ```toncli run contracts/fift/data.fif```
2. ```toncli run contracts/kyc.fc```
3. ```toncli deploy -n testnet```

You can now make requests to contract:
```toncli get seqno```
