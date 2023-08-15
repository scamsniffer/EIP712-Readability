
import { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'
import { TransactionLike, PermitMessage } from "../types"
import { BigNumberish } from '@ethersproject/bignumber'
import { Approval } from "../types";
import { Interface } from "@ethersproject/abi";
import Permit2ABI from "../abis/permit2.json";

export const permit2 = new Interface(Permit2ABI);

export interface PermitDetails {
    token: string
    amount: BigNumberish
    expiration: BigNumberish
    nonce: BigNumberish
}

export interface PermitSingle {
    details: PermitDetails
    spender: string
    sigDeadline: BigNumberish
}

export interface PermitBatch {
    details: PermitDetails[]
    spender: string
    sigDeadline: BigNumberish
}

export type PermitSingleData = {
    domain: TypedDataDomain
    message: PermitSingle
}

export type PermitBatchData = {
    domain: TypedDataDomain
    message: PermitBatch
}


function isPermit(permit: PermitSingle | PermitBatch): permit is PermitSingle {
    return !Array.isArray(permit.details)
}

export class Permit2 {

    static parse(eipData: PermitSingleData | PermitBatchData) {
        const approvals: Approval[] = [];
        const { message: permit } = eipData;
        // AllowanceTransfer
        if (isPermit(permit)) {
            if (permit.spender) {
                approvals.push({
                    token: permit.details.token,
                    spender: permit.spender,
                    amount: permit.details.amount,
                    nonce: permit.details.nonce,
                    expiration: permit.details.expiration
                })
            }
        } else {
            for (let index = 0; index < permit.details.length; index++) {
                const detail = permit.details[index];
                if (detail.token) {
                    approvals.push({
                        token: detail.token,
                        spender: permit.spender,
                        amount: detail.amount,
                        nonce: detail.nonce,
                        expiration: detail.expiration
                    })
                }
            }
        }
        return {
            permits: approvals
        }
    }

    static parseFromTranscation(transaction: TransactionLike): Array<PermitMessage> {
        if (!transaction.data) {
            return []
        }
        const signHash = transaction.data.slice(0, 10);
        if (
            transaction.to && [
                "0x2a2d80d1",
            ].includes(signHash)
        ) {
            const input = permit2.decodeFunctionData("0x2a2d80d1", transaction.data);
            const parameters = input.permitBatch;
            const message = Permit2.parse({
                domain: {},
                message: parameters
            });

            message.permits.map(c => {
                c.owner = input.owner;
                return c
            })
            
            return [
                message
            ]
        }
        return [];
    }
}