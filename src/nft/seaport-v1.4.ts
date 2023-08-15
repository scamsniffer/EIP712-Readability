
import { BigNumberish, BigNumber } from '@ethersproject/bignumber'
import { ParsedDetail, NFTMessageBulk, OrderType, NFTProtocolType, cacluteBalanceChange, BalanceChange, NFTMessage, NFTDetail, FTDetail, TransactionLike, bn } from "../types"
import { Interface } from "@ethersproject/abi";
import seaportABI from "../abis/seaport.json";
import { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'

export const seaport = new Interface(seaportABI);
const matchOrders = ["0xa8174404"];

export type AdditionalRecipient = {
    amount: BigNumberish;
    recipient: string;
};

export type FulfillmentComponent = {
    orderIndex: number;
    itemIndex: number;
};

export type Fulfillment = {
    offerComponents: FulfillmentComponent[];
    considerationComponents: FulfillmentComponent[];
};

export type CriteriaResolver = {
    orderIndex: number;
    side: 0 | 1;
    index: number;
    identifier: BigNumberish;
    criteriaProof: string[];
};

export type BasicOrderParameters = {
    considerationToken: string;
    considerationIdentifier: BigNumberish;
    considerationAmount: BigNumberish;
    offerer: string;
    zone: string;
    offerToken: string;
    offerIdentifier: BigNumberish;
    offerAmount: BigNumberish;
    basicOrderType: number;
    startTime: string | BigNumberish | number;
    endTime: string | BigNumberish | number;
    zoneHash: string;
    salt: string;
    offererConduitKey: string;
    fulfillerConduitKey: string;
    totalOriginalAdditionalRecipients: BigNumberish;
    additionalRecipients: AdditionalRecipient[];
    signature: string;
};

export type OfferItem = {
    itemType: number;
    token: string;
    identifierOrCriteria: BigNumberish;
    startAmount: BigNumberish;
    endAmount: BigNumberish;
};

export type ConsiderationItem = {
    itemType: number;
    token: string;
    identifierOrCriteria: BigNumberish;
    startAmount: BigNumberish;
    endAmount: BigNumberish;
    recipient: string;
};

export type OrderParameters = {
    offerer: string;
    zone: string;
    offer: OfferItem[];
    consideration: ConsiderationItem[];
    orderType: number;
    startTime: string | BigNumberish | number;
    endTime: string | BigNumberish | number;
    zoneHash: string;
    salt: string;
    conduitKey: string;
    totalOriginalConsiderationItems: string | BigNumberish | number;
};

export type OrderComponents = Omit<
    OrderParameters,
    "totalOriginalConsiderationItems"
> & {
    counter: BigNumberish;
};

export type Order = {
    parameters: OrderParameters;
    signature: string;
};

export type AdvancedOrder = {
    parameters: OrderParameters;
    numerator: string | BigNumberish | number;
    denominator: string | BigNumberish | number;
    signature: string;
    extraData: string;
};

export type BulkOrder = {
    tree: OrderComponents[]
}

export type Message = {
    domain: TypedDataDomain,
    message: OrderComponents | BulkOrder
}

function isBulkOrder(message: OrderComponents | BulkOrder): message is BulkOrder {
    return "tree" in message
}

export class SeaportV14 {

    static isBulk(message: NFTMessage | NFTMessageBulk) : message is NFTMessageBulk {
        return "messages" in message
    }

    static parseOrder(item: OfferItem | ConsiderationItem): ParsedDetail {
        if (item.itemType <= 1) {
            return {
                kind: "token",
                detail: {
                    type: item.itemType == 0 ? 'native' : 'erc20',
                    currency: item.token,
                    amount: item.startAmount.toString()
                }
            }
        } else {
            return {
                kind: "nft",
                detail: {
                    type: item.itemType == 2 ? 'erc721' : 'erc1155',
                    collection: item.token,
                    tokenId: item.identifierOrCriteria.toString(),
                    amount: item.startAmount.toString()
                }
            }
        }
    }

    static parse(typedData: Message): NFTMessage | NFTMessageBulk {

        let orderComponents = [];
        let parsedMessages = [];

        const totalBalanceChange: BalanceChange = {};

        if (isBulkOrder(typedData.message)) {
            orderComponents = typedData.message.tree;
        } else {
            orderComponents.push(typedData.message)
        }

        for (let index = 0; index < orderComponents.length; index++) {
            const order = orderComponents[index];
            const { offerer, offer, consideration } = order
            const parsedOffers = offer.map(_ => SeaportV14.parseOrder(_));
            const receivedConsiderRation = consideration.filter(_ => _.recipient === order.offerer).map(_ => SeaportV14.parseOrder(_));

            const balanceChange: BalanceChange = {};

            parsedOffers.forEach((item) => cacluteBalanceChange(balanceChange, offerer, item, false));
            receivedConsiderRation.forEach((item) => cacluteBalanceChange(balanceChange, offerer, item, true));

            parsedOffers.forEach((item) => cacluteBalanceChange(totalBalanceChange, offerer, item, false));
            receivedConsiderRation.forEach((item) => cacluteBalanceChange(totalBalanceChange, offerer, item, true));

            const otherRecepients = consideration
                .filter(_ => _.recipient != order.offerer).map(_ => _.recipient)
                .reduce(
                    (all, value) => all.add(value),
                    new Set<string>()
                );

            for (const recipient of Array.from(otherRecepients)) {
                const matched = consideration.filter(_ => _.recipient === recipient).map(_ => SeaportV14.parseOrder(_));
                matched.forEach((item) => cacluteBalanceChange(balanceChange, recipient.toLowerCase(), item, true));
            }

            const totalNFTs = parsedOffers.filter(c => c.kind === "nft").length;
            const orderType = totalNFTs > 0 ? OrderType.Listing : OrderType.Offer;

            const messageDeatil = {
                offerer,
                balanceChange,
                orderType,
                offer: parsedOffers,
                consideration: receivedConsiderRation,
                startTime: order.startTime,
                endTime: order.endTime,
                type: NFTProtocolType.seaport
            }

            parsedMessages.push(messageDeatil)
        }

        if (isBulkOrder(typedData.message)) {
            return {
                balanceChange: totalBalanceChange,
                messages: parsedMessages
            }
        } else {
            return parsedMessages[0]
        }

    }

    static parseFromTranscation(transaction: TransactionLike): Array<NFTMessage | NFTMessageBulk> {
        if (!transaction.data) {
            return []
        }
        const signHash = transaction.data.slice(0, 10);
        const allOrders: Array<NFTMessage | NFTMessageBulk> = []
        if (transaction.to && matchOrders.includes(signHash)) {
            const input = seaport.decodeFunctionData("matchOrders", transaction.data);
            for (let index = 0; index < input.orders.length; index++) {
                const order = input.orders[index];
                const parameters = order.parameters;
                const message = SeaportV14.parse({
                    domain: {},
                    message: parameters
                });
                allOrders.push(message)
            }
        }
        return allOrders
    }

}