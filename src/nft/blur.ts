
import { BigNumberish, BigNumber } from '@ethersproject/bignumber'
import { BalanceChange, OrderType, cacluteBalanceChange, NFTMessage, ParsedDetail, TransactionLike, NFTProtocolType } from "../types"
import { Interface } from "@ethersproject/abi";
import BlurABI from "../abis/blur.json";
import { HashZero } from "@ethersproject/constants";
import { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'

export const blur = new Interface(BlurABI);

const matchOrders = [
    '0xb3be57f8',
    '0x9a1fc3a7'
]

export enum Side {
    Buy = 0,
    Sell = 1,
}

export enum AssetType {
    ERC721 = 0,
    ERC1155 = 1,
}

export enum SignatureVersion {
    Single = 0,
    Bulk = 1,
}

export interface Fee {
    rate: number;
    recipient: string;
}

export interface OrderParameters {
    trader: string;
    side: Side;
    matchingPolicy: string;
    collection: string;
    tokenId: string | number;
    amount: string | number;
    paymentToken: string;
    price: BigNumberish;
    listingTime: string;
    expirationTime: string;
    fees: Fee[];
    salt: number;
    extraParams: string;
    nonce: any;
}

export type Message = {
    domain: TypedDataDomain,
    message: OrderParameters
}


export class Blur {

    static parse(typedData: Message): NFTMessage {
        const { message: order } = typedData
        const offerer = order.trader
        const balanceChange: BalanceChange = {};

        const offers: ParsedDetail[] = [
            order.side === Side.Buy ? {
                kind: "token",
                detail: {
                    type: "native",
                    currency: order.paymentToken,
                    amount: order.price
                }
            } : {
                kind: "nft",
                detail: {
                    collection: order.collection,
                    tokenId: order.tokenId.toString(),
                    amount: order.amount.toString()
                }
            }
        ];

        const afterFeePrice = order.fees.reduce((total, fee) => {
            const feeAmount = BigNumber.from(order.price).mul(fee.rate).div(10000);
            return total.sub(feeAmount);
        }, BigNumber.from(order.price));

        const notZero = afterFeePrice.gt(0)
        const consideration: ParsedDetail[] = order.side === Side.Buy ? [{
            kind: "nft",
            detail: {
                type: 'erc721',
                collection: order.collection,
                tokenId: order.tokenId.toString(),
                amount: order.amount.toString()
            }
        }] : notZero ? [{
            kind: "token",
            detail: {
                type: "native",
                currency: order.paymentToken,
                amount: afterFeePrice
            }
        }] : []
            ;

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
            startTime: order.listingTime,
            type: NFTProtocolType.blur,
            endTime: order.expirationTime
        }
    }

    static parseFromTranscation(transaction: TransactionLike): Array<NFTMessage> {
        if (!transaction.data) {
            return []
        }
        const signHash = transaction.data.slice(0, 10);
        const allOrders: NFTMessage[] = []

        if (transaction.to && matchOrders.includes(signHash)) {
            const isBulk = signHash === '0xb3be57f8';
            const input = isBulk ? blur.decodeFunctionData("bulkExecute", transaction.data) : blur.decodeFunctionData("execute", transaction.data);
            const allExecutions = isBulk ? input.executions : [input]

            for (let index = 0; index < allExecutions.length; index++) {
                const execution = allExecutions[index];
                const sellInput = execution.sell;
                const isSellOrder = sellInput.order.side === 1 && sellInput.s != HashZero;
                const orderInput = isSellOrder ? execution.sell : execution.buy;
                const order = orderInput.order;
                try {
                    const message = Blur.parse({
                        domain: {},
                        message: order
                    });
                    allOrders.push(message)
                } catch (err) {
                }
            }
        }
        return allOrders
    }

}