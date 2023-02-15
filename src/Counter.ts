import { Contract, ContractProvider, Sender, Address, Cell, contractAddress, beginCell } from "ton-core";

export default class Counter implements Contract {

    static createForDeploy(code: Cell, initialCounterValue: number): Counter {
        const data = beginCell()
            .storeUint(initialCounterValue, 64)
            .storeUint(0, 64) // initial seqno value
            .endCell();
        const workchain = 0; // deploy to workchain 0
        const address = contractAddress(workchain, { code, data });
        return new Counter(address, { code, data });
    }

    async sendDeploy(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            value: "0.01", // send 0.01 TON to contract for rent
            bounce: false
        });
    }

    async getCounter(provider: ContractProvider) {
        const { stack } = await provider.get("counter", []);
        return stack.readBigNumber();
    }

    async getSeqno(provider: ContractProvider) {
        const { stack } = await provider.get("seqno", []);
        return stack.readBigNumber();
    }

    async sendIncrement(provider: ContractProvider, via: Sender) {
        const messageBody = beginCell()
            .storeUint(1, 32) // op (op #1 = increment)
            .storeUint(0, 64) // query id
            .endCell();
        await provider.internal(via, {
            value: "0.002", // send 0.002 TON for gas
            body: messageBody
        });
    }

    async sendExternalIncrement(provider: ContractProvider, num: number) {
        const seqno = await this.getSeqno(provider);
        const messageBody = beginCell()
            .storeUint(seqno, 32) // op (op #1 = increment)
            .storeUint(num, 32) // query id
            .endCell();
        await provider.external(messageBody);
    }

    constructor(readonly address: Address, readonly init?: { code: Cell, data: Cell }) {}
}
