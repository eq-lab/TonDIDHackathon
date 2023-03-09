#### Compile packages
```bash
yarn workspace @kyc/contracts install
yarn workspace @kyc/contracts compile
yarn workspace @kyc/contracts build
yarn workspace @kyc/cli install
yarn workspace @kyc/cli build
yarn workspace @kyc/frontend-user install
```

#### Run unit tests
```bash
yarn workspace @kyc/contracts test
```

#### Deploy new contract
```bash
yarn workspace @kyc/cli start deploy \
  --name 'demo' \
  --fee '0.1' \
  --provider '0x0f52adfb686efdf38c28c1009af9efcd11b9a5ae186f5d8b8e62ab9065052c97' \
  --deposit '0.6' \
  --accounts 'lemon.ton,alberto.ton'
``` 

#### Run local frontend
```bash
yarn workspace @kyc/frontend-user start
```

#### Read KYC contract state
```bash
yarn workspace @kyc/cli start read-state \
  --name 'demo'
``` 

#### Read account state
```bash
yarn workspace @kyc/cli start read-acc-state \
  --name 'demo' \
  --account 'gavin.ton'
``` 

#### Read all requested accounts
```bash
yarn workspace @kyc/cli start read-requested \
  --name 'demo'
``` 

#### Request KYC for TON Domain name
```bash
yarn workspace @kyc/cli start send-request \
  --name 'demo' \
  --mnemonic "$(cat data/keys/EQDnO8IoL0E3By60vnMyunzOILU_nSAJo1DmBhEtfniUAj8C)" \
  --account 'my_domain_name.ton'
``` 

#### Set account state
```bash
yarn workspace @kyc/cli start set-status \
  --name 'demo' \
  --domain 'gavin2.ton' \
  --status 'declined'
``` 
