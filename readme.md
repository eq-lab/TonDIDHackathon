# DID issuer for TON hackathon 
- [Video demonstration](https://youtu.be/l4auJRelwPg)
- [DoraHacks](https://dorahacks.io/buidl/4454) 

## Introduction
In our work we present a POC for the Digital Identity infrastructure on the Telegram Open Network. Our ultimate vision is a protocol that enables transparent and permissionless trust infrastructure for the future of web3 where the security and privacy of users’ verifiable credentials are achieved through a clever combination of blockchain technology and zero-knowledge proofs.
## System Roles
Conforming to the [W3C Verifiable Credentials Data Model](https://w3c.github.io/vc-data-model/) we define following system roles:

- __Holder__: A holder is an individual or entity that possesses a verifiable credential. Holders are responsible for presenting their credentials to verifiers, who then verify the authenticity of the credential. Holders control their own private data and choose to what extent and which verifiers to share it with.


- __Issuer__: Issuer is an entity that confirms the validity of certain claims made by the Holder that is the subject of a verifiable credential. The job of the Issuer is to act as a trusted third party. Issuers must be able to write information into the blockchain - that is - confirm the validity of credentials of the Holder. On the other hand, the Issuer must be able to revoke Holder credentials. This is useful in many real life applications where, for example, government issued ids have certain expiration dates.


- __Verifier__: A verifier is an entity that verifies the authenticity of a verifiable credential presented by the Holder. Verifiers can be anyone who needs to confirm the authenticity of a credential, such as employers, service providers, or government agencies. Verifiers implicitly trust Issuers, and the mechanics of this trust has to be further investigated and tokenized when we introduce the tokenomics model to the protocol.

## Demonstration flow
1. Issuer registers on-chain by deploying a special-purpose smart-contract, where Issuer specifies his public key and the commission it charges for the services.
2. Holder interacts with the issuer smart contract by requesting a confirmation for his verifiable credential and pays a fee specified by the Issuer. In the POC we simply verify TON domain names.
3. Issuer sets the corresponding request state (approved or declined), this information is written to the Issuer smart contract along with the TON domain name.
4. Issuer may further decline previously approved credentials.
5. Verifier can request holder status via `get_account_state` GET-method

## Open questions
- Efficient working with TON storage, JETTONs and SBTs
- How to read account’s JETTONs
- How to sign arbitrary payload using Tonconnect.

## Start instructions
### Compile packages
```bash
yarn workspace @did-issuer/contracts install
yarn workspace @did-issuer/contracts compile
yarn workspace @did-issuer/contracts build
yarn workspace @did-issuer/cli install
yarn workspace @did-issuer/cli build
yarn workspace @did-issuer/frontend-user install
```

### Run unit tests
```bash
yarn workspace @did-issuer/contracts test
```

### Deploy new contract
```bash
yarn workspace @did-issuer/cli start deploy \
  --name 'demo' \
  --fee '0.1234' \
  --provider '0x0f52adfb686efdf38c28c1009af9efcd11b9a5ae186f5d8b8e62ab9065052c97' \
  --deposit '0.6' \
  --accounts 'lemon.ton,alberto.ton'
``` 

### Run local frontend
```bash
yarn workspace @did-issuer/frontend-user start
```

### Read DID issuer contract state
```bash
yarn workspace @did-issuer/cli start read-state \
  --name 'demo'
``` 

### Read account state
```bash
yarn workspace @did-issuer/cli start read-acc-state \
  --name 'demo' \
  --account 'gavin.ton'
``` 

### Read all requested accounts
```bash
yarn workspace @did-issuer/cli start read-requested \
  --name 'demo'
``` 

### Request check for TON Domain name
```bash
yarn workspace @did-issuer/cli start send-request \
  --name 'demo' \
  --mnemonic "$(cat packages/cli/keys/EQDnO8IoL0E3By60vnMyunzOILU_nSAJo1DmBhEtfniUAj8C)" \
  --account 'ara.ton'
``` 

### Set account state
```bash
yarn workspace @did-issuer/cli start set-status \
  --name 'demo' \
  --domain 'overseven.ton' \
  --status 'declined'
``` 
