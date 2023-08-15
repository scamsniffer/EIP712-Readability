
import { BigNumberish, BigNumber } from '@ethersproject/bignumber'
import { BalanceChange, OrderType, cacluteBalanceChange, NFTMessage, ParsedDetail, TransactionLike, NFTProtocolType } from "../types"
import { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'

export interface LoanOffer {
    lender: string;
    collection: string;
    totalAmount: BigNumberish;
    minAmount: BigNumberish;
    maxAmount: BigNumberish;
    auctionDuration: BigNumberish;
    salt: BigNumberish;
    expirationTime: BigNumberish;
    rate: number;
    oracle: string;
    nonce: BigNumberish;
}

export type Message = {
    domain: TypedDataDomain,
    message: LoanOffer
}

export class Blend {

    static parse(typedData: Message): NFTMessage {
        const { message: order } = typedData
        const offerer = order.lender
        const balanceChange: BalanceChange = {};
        const offers: ParsedDetail[] = [
            {
                kind: "token",
                detail: {
                    type: "native",
                    currency: "0x0000000000000000000000000000000000000000",
                    amount: order.maxAmount
                }
            }
        ];

        const consideration: ParsedDetail[] = [
            {
                kind: "nft",
                detail: {
                    type: 'erc721',
                    collection: order.collection,
                    amount: 1
                }
            }
        ];

        offers.forEach((item) => cacluteBalanceChange(balanceChange, offerer, item, false));
        consideration.forEach((item) => cacluteBalanceChange(balanceChange, offerer, item, true));

        const totalNFTs = offers.filter(c => c.kind === "nft").length;
        const orderType = totalNFTs > 0 ? OrderType.Listing : OrderType.Offer;

        return {
            offerer,
            balanceChange,
            offer: offers,
            orderType,
            consideration: consideration,
            startTime: Math.floor(Date.now() / 1000),
            type: NFTProtocolType.blend,
            endTime: order.expirationTime
        }
    }

    // static parseFromTranscation(transaction: TransactionLike): Array<NFTMessage> {
    //     if (!transaction.data) {
    //         return []
    //     }
    //     const signHash = transaction.data.slice(0, 10);
    //     const allOrders: NFTMessage[] = []

    //     if (transaction.to && matchOrders.includes(signHash)) {
    //         const isBulk = signHash === '0xb3be57f8';
    //         const input = isBulk ? blur.decodeFunctionData("bulkExecute", transaction.data) : blur.decodeFunctionData("execute", transaction.data);
    //         const allExecutions = isBulk ? input.executions : [input]

    //         for (let index = 0; index < allExecutions.length; index++) {
    //             const execution = allExecutions[index];
    //             const sellInput = execution.sell;
    //             const isSellOrder = sellInput.order.side === 1 && sellInput.s != HashZero;
    //             const orderInput = isSellOrder ? execution.sell : execution.buy;
    //             const order = orderInput.order;
    //             try {
    //                 const message = Blur.parse({
    //                     domain: {},
    //                     message: order
    //                 });
    //                 allOrders.push(message)
    //             } catch (err) {
    //             }
    //         }
    //     }
    //     return allOrders
    // }
}