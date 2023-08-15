
import { BigNumberish, BigNumber } from '@ethersproject/bignumber'

export const bn = (x: any) => BigNumber.from(x);

export function cacluteBalanceChange(balanceChange: BalanceChange, address: string, parsed: ParsedDetail, isReceived: boolean) {
    let keyId = null 
    if (parsed.kind === "token") {
        const data = parsed.detail as FTDetail;
        keyId = `${data.type||'nft'}:${data.currency}`;
    } else {
        const data = parsed.detail as NFTDetail;
        keyId = `${data.type}:${data.collection}:${data.tokenId}`
    }
    address = address.toLowerCase()

    balanceChange[address] = balanceChange[address] || {};
    balanceChange[address][keyId] = balanceChange[address][keyId] || 0;
    balanceChange[address][keyId] = isReceived ?
    bn(balanceChange[address][keyId]).add(parsed.detail.amount).toString() :
    bn(balanceChange[address][keyId]).sub(parsed.detail.amount).toString()
}


export enum OrderType {
    Listing = "listing",
    Offer = "offer"
}

export enum NFTProtocolType {
    seaport = "seaport",
    blur = "blur",
    blend = "blend",
    looksrare = "looksrare"
}

export type BalanceChangeDetail = {
    [keyId: string]: BigNumberish;
};

export type BalanceChange = {
    [address: string]: BalanceChangeDetail;
};

export type NFTDetail = {
    type?:  'erc721' | 'erc1155'
    collection: string
    tokenId?: BigNumberish
    amount: BigNumberish
}

export type FTDetail = {
    type?:  'native' | 'erc20'
    currency: string
    amount: BigNumberish
}

export type ParsedDetail = {
    kind: "nft",
    detail: NFTDetail
} | {
    kind: "token",
    detail: FTDetail
};

export type NFTOrder = {
    type: OrderType,
    collection: string,
    tokenId: BigNumberish,
    amount: BigNumberish,
    currency?: string | null,
    price?:  BigNumberish,
    recipient?: string,
}

export type NFTMessage = {
    offerer: string;
    offer: ParsedDetail[];
    orderType: OrderType;
    balanceChange: BalanceChange;
    consideration: ParsedDetail[];
    startTime: string | BigNumberish | number;
    endTime: string | BigNumberish | number;
    type: NFTProtocolType
}

export type NFTMessageBulk = {
    balanceChange: BalanceChange;
    messages: NFTMessage[]
}

export interface ParserAdapter {
    parse(order: any): NFTMessage | NFTMessageBulk;
    parseFromTranscation(transaction: TransactionLike): Array<NFTMessage | NFTMessageBulk>;
}

export interface PermitParserAdapter {
    parse(order: any): PermitMessage;
    parseFromTranscation?(transaction: TransactionLike): Array<PermitMessage>;
}

export interface Approval {
    owner?: string;
    token?: string;
    spender: string;
    amount: string | BigNumberish | number;
    nonce: string | BigNumberish | number;
    expiration: string | BigNumberish | number;
}

export interface TransactionLike {
    from: string
    to: string | null
    data?: string
    value?: BigNumberish
}

export interface EIP712Like {
    types: any;
    domain: any;
    primaryType: any;
    message: any;
}

export type ParsedMessage = {
    kind: "nft",
    detail: NFTMessage | NFTMessageBulk
} | {
    kind: "permit",
    detail: PermitMessage
};

export function isBulkMessage(message: NFTMessage | NFTMessageBulk) : message is NFTMessageBulk {
    return "messages" in message
}

export type PermitMessage = {
    permits: Approval[]
    // transfers: TransferDetail[]
}