import { TransactionLike, isBulkMessage, bn, NFTMessageBulk, OrderType, ParsedDetail, NFTMessage, EIP712Like, ParserAdapter } from "../types"
import { Seaport, Blur } from "../nft/";
import { ScamSnifferRegistry } from "./price";
import { parseRequest } from "../parser";

const allAdapters: Array<ParserAdapter> = [];

allAdapters.push(Seaport as ParserAdapter);
allAdapters.push(Blur as ParserAdapter);

export class Security {

    static async checkNFTMessages(rawMessages: Array<NFTMessageBulk | NFTMessage>) {
        const suspiciousMessages = [];
        const allCurrency = new Set<string>();
        const allCollections = new Set<string>();

        let messages: NFTMessage[] = [];

        // Flatten messages
        for (let index = 0; index < rawMessages.length; index++) {
            const message = rawMessages[index];
            if (isBulkMessage(message)) {
                messages = messages.concat(message.messages)
            } else {
                messages.push(message)
            }
        }

        for (let index = 0; index < messages.length; index++) {
            const message = messages[index];
            if (!message.offer.length) continue;

            // only working with sinle model
            if (message.consideration.length === 0) {
                suspiciousMessages.push({
                    considerationValue: 0,
                    message
                });
                continue;
            }

            message.offer.forEach(item => {

                if (item.kind === "nft") {
                    allCollections.add(item.detail.collection)
                } else {
                    allCurrency.add(item.detail.currency)
                }
            })
            message.consideration.forEach(item => {
                if (item.kind === "nft") {
                    allCollections.add(item.detail.collection)
                } else {
                    allCurrency.add(item.detail.currency)
                }
            });
        }

        // realtime check
        if (suspiciousMessages.length === messages.length) {
            return suspiciousMessages;
        }

        const BETH = '0x0000000000a39bb272e79075ade125fd351887ac';
        const WETH = 'token:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
        const queryIds = Array.from(allCurrency)
            .map(c => `token:${c.toLowerCase()}`)
            .concat(
                Array.from(allCollections).map(_ => `nft:${_.toLowerCase()}`)
            ).filter(c => !c.includes(BETH));

        const priceData = messages.length ? await ScamSnifferRegistry.getPrice(queryIds.concat(WETH)) : [];

        function computePrice(totalValue: number, item: ParsedDetail) {
            let assetValue = 0;
            if (item.kind === "nft") {
                const ethPrice = priceData.find((c: any) => c.symbol === "WETH" || c.symbol === "ETH");
                const tokenId = `nft:${item.detail.collection.toLowerCase()}`;
                const priceInfo = priceData.find((c: any) => c.id === tokenId);
                if (priceInfo) {
                    // lower price
                    const rawPrice = [
                        priceInfo['1day'],
                        priceInfo['7day'],
                        priceInfo['30day']
                    ]
                    const validPrices = rawPrice.filter(_ => _ != null && _ != undefined);
                    if (!validPrices.length) {
                        validPrices.push(0);
                    }
                    const floorPrice = Math.min.apply(null, validPrices);
                    assetValue = parseInt(item.detail.amount.toString()) * floorPrice * ethPrice.price;
                } else {
                    throw new Error(`price not found id=${tokenId}`)
                }
            } else {
                const tokenId = `token:${item.detail.currency.toLowerCase()}`;
                const ethPrice = priceData.find((c: any) => c.symbol === "WETH" || c.symbol === "ETH");
                const priceInfo = tokenId.includes(BETH) ? ethPrice : priceData.find((c: any) => c.id === tokenId);
                if (priceInfo) {
                    const tokenBase = bn(10).pow(bn(priceInfo.decimals));
                    assetValue = bn(item.detail.amount)
                        .mul(bn((priceInfo.price * 1000000).toFixed(0)))
                        .div(bn(1000000))
                        .div(tokenBase)
                        .toNumber();
                } else {
                    throw new Error(`price not found id=${tokenId}`)
                }
            }

            return totalValue + assetValue;
        }


        for (let index = 0; index < messages.length; index++) {
            const message = messages[index];
            if (!message.offer.length) continue;

            const offerValueInUsd = message.offer.reduce(computePrice, 0);
            const considerationValueInUsd = message.consideration.reduce(computePrice, 0);

            const percent = considerationValueInUsd > 0 && offerValueInUsd > 0 ? considerationValueInUsd / offerValueInUsd : 0;

            const hasNFTs = message.offer.filter(_ => _.kind === "nft").length;
            if (offerValueInUsd < 50) {
                // skip price low case
                continue;
            }

            // If the selling price too small
            if (percent < 0.1 && hasNFTs) {
                suspiciousMessages.push({
                    offerValue: offerValueInUsd,
                    considerationValue: considerationValueInUsd,
                    message
                });
            }
        }

        return suspiciousMessages;
    }

    static async checkMessage(request: EIP712Like) {
        const message = await parseRequest(request);
        if (message?.kind != 'nft') return null;
        const result = await Security.checkNFTMessages([message.detail]);
        return result[0]
    }

    static async checkTransaction(transaction: TransactionLike) {
        for (let index = 0; index < allAdapters.length; index++) {
            const adapter = allAdapters[index];
            const messages = adapter.parseFromTranscation(transaction);
            if (messages.length) {
                return Security.checkNFTMessages(messages)
            }
        }
        return []
    }
}