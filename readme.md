# DID issuer for TON hackathon 

#### Compile packages
```bash
yarn workspace @did-issuer/contracts install
yarn workspace @did-issuer/contracts compile
yarn workspace @did-issuer/contracts build
yarn workspace @did-issuer/cli install
yarn workspace @did-issuer/cli build
yarn workspace @did-issuer/frontend-user install
```

#### Run unit tests
```bash
yarn workspace @did-issuer/contracts test
```

#### Deploy new contract
```bash
yarn workspace @did-issuer/cli start deploy \
  --name 'demolet' \
  --fee '0.0001' \
  --provider '0x0f52adfb686efdf38c28c1009af9efcd11b9a5ae186f5d8b8e62ab9065052c97' \
  --deposit '0.1' \
  --accounts 'lemon.ton,alberto.ton'
``` 

#### Run local frontend
```bash
yarn workspace @did-issuer/frontend-user start
```

#### Read DID issuer contract state
```bash
yarn workspace @did-issuer/cli start read-state \
  --name 'demo'
``` 

#### Read account state
```bash
yarn workspace @did-issuer/cli start read-acc-state \
  --name 'demo' \
  --account 'gavin.ton'
``` 

#### Read all requested accounts
```bash
yarn workspace @did-issuer/cli start read-requested \
  --name 'demo'
``` 

#### Request check for TON Domain name
```bash
yarn workspace @did-issuer/cli start send-request \
  --name 'demo' \
  --mnemonic "$(cat packages/cli/keys/EQDnO8IoL0E3By60vnMyunzOILU_nSAJo1DmBhEtfniUAj8C)" \
  --account 'ara.ton'
``` 

#### Set account state
```bash
yarn workspace @did-issuer/cli start set-status \
  --name 'demo' \
  --domain 'gavin2.ton' \
  --status 'declined'
``` 
