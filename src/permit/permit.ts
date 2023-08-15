
import { BigNumberish } from '@ethersproject/bignumber'
import { MaxUint256 } from '@ethersproject/constants'
import { PermitMessage, TransactionLike, Approval } from "../types"
import { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'
import { Interface } from "@ethersproject/abi"
import ERC20PermitABI from "../abis/erc20-permit.json"

export const erc20Permit = new Interface(ERC20PermitABI)

export interface ERC2612Permit {
    owner: string;
    spender: string;
    value: BigNumberish,
    nonce: BigNumberish,
    deadline: BigNumberish
}

export interface DaiPermit {
    holder: string;
    spender: string;
    nonce: BigNumberish;
    expiry: BigNumberish;
    allowed?: boolean;
}

export type Message = {
    domain: TypedDataDomain,
    message: ERC2612Permit | DaiPermit
}


function isPermit(permit: DaiPermit | ERC2612Permit): permit is DaiPermit {
    return "expiry" in permit;
}

export class Permit {

    static parse(typedData: Message): PermitMessage {
        let approvals: Approval[] = [];
        const { message } = typedData;
        if (isPermit(message)) {
            if (message.spender && message.nonce) {
                approvals.push({
                    token: typedData.domain.verifyingContract,
                    owner: message.holder,
                    spender: message.spender,
                    amount: message.allowed ? MaxUint256 : "0",
                    nonce: message.nonce,
                    expiration: message.expiry,
                })
            } else {
                throw new Error("parse failed")
            }
        } else {
            if (message.spender && message.value) {
                approvals.push({
                    token: typedData.domain.verifyingContract,
                    owner: message.owner,
                    spender: message.spender,
                    amount: message.value,
                    nonce: message.nonce,
                    expiration: message.deadline,
                })
            } else {
                throw new Error("parse failed")
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
                "0xd505accf",
            ].includes(signHash)
        ) {
            const input = erc20Permit.decodeFunctionData("0xd505accf", transaction.data);
            const message = Permit.parse({
                domain: {
                    verifyingContract: transaction.to
                },
                message: input as any
            });
            return [
                message
            ]
        }
        return [];
    }
}