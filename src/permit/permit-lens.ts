
import { BigNumberish } from '@ethersproject/bignumber'
import { MaxUint256 } from '@ethersproject/constants'
import { PermitMessage, Approval } from "../types"
import { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'

export type Message = {
    domain: TypedDataDomain,
    message: any
}

export class PermitLens {

    static parse(typedData: Message): PermitMessage {
        let approvals: Approval[] = [];
        const { message } = typedData;
        if (message.approved && message.operator) {
            approvals.push({
                token: typedData.domain.verifyingContract,
                owner: message.owner,
                spender: message.operator,
                amount: message.approved ? MaxUint256 : "0",
                nonce: message.nonce,
                expiration: message.deadline,
            })
        } else {
            throw new Error("parse failed")
        }

        return {
            permits: approvals
        }
    }

}