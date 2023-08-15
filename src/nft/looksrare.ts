
import { BigNumberish, BigNumber } from '@ethersproject/bignumber'
import { BalanceChange, OrderType, NFTProtocolType, cacluteBalanceChange, NFTMessage, ParsedDetail, NFTOrder } from "../types"
import { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'

export interface MakerOrder {
    isOrderAsk: boolean; // true --> ask / false --> bid
    signer: string; // signer address of the maker order
    collection: string; // collection address
    price: BigNumberish;
    tokenId: BigNumberish; // id of the token
    amount: BigNumberish; // amount of tokens to sell/purchase (must be 1 for ERC721, 1+ for ERC1155)
    strategy: string; // strategy for trade execution (e.g., DutchAuction, StandardSaleForFixedPrice)
    currency: string; // currency address
    nonce: BigNumberish; // order nonce (must be unique unless new maker order is meant to override existing one e.g., lower ask price)
    startTime: BigNumberish; // startTime in timestamp
    endTime: BigNumberish; // endTime in timestamp
    minPercentageToAsk: BigNumberish;
    params: any[]; // params (e.g., price, target account for private sale)
}

export interface TakerOrder {
    isOrderAsk: boolean; // true --> ask / false --> bid
    taker: string; // Taker address
    price: BigNumberish; // price for the purchase
    tokenId: BigNumberish;
    minPercentageToAsk: BigNumberish;
    params: any[]; // params (e.g., price)
}

export type Message = {
    domain: TypedDataDomain,
    message: MakerOrder
}

export class LooksRare {

    static parse(typedData: Message): NFTMessage {
        const { message: order } = typedData
        const offerer = order.signer
        const balanceChange: BalanceChange = {};
        const offers: ParsedDetail[] = [
            order.isOrderAsk ? {
                kind: "token",
                detail: {
                    type: "native",
                    currency: order.currency,
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

        const consideration: ParsedDetail[] = [
            order.isOrderAsk ? {
                kind: "nft",
                detail: {
                    collection: order.collection,
                    tokenId: order.tokenId.toString(),
                    amount: order.amount.toString()
                }
            } : {
                kind: "token",
                detail: {
                    type: "native",
                    currency: order.currency,
                    amount: order.price
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
            startTime: order.startTime,
            type: NFTProtocolType.blur,
            endTime: order.endTime
        }
    }
}