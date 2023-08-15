import { Seaport } from "../../src/nft/seaport"
import { OrderComponents } from "../../src/nft/seaport"
import listing from "./__fixtures__/listing.json"
import listingWithFee from "./__fixtures__/listing-fee.json"
import offerData from "./__fixtures__/offer.json"
import batch from "./__fixtures__/batch.json"
import batchCase2 from "./__fixtures__/batch-case2.json"
import case1 from "./__fixtures__/case1.json"
import transcation from "./__fixtures__/transcation.json"
import transcationNormal from "./__fixtures__/transcation-normal.json"
import {expect, describe, it, jest, test} from '@jest/globals';

describe("Seaport", () => {

    it("signle-listing", () => {
        const inputMessage = listing as any;
        const message = Seaport.parse(inputMessage);
        
        const offer = message.offer.find(_ => _.kind === "nft")
        const consideration = message.consideration.find(_ => _.kind === "token")
        
        expect(offer).not.toBeNull();
        expect(consideration).not.toBeNull();

        if (offer?.kind == "nft") {
            expect(offer?.detail.tokenId).toBe("3377")
        }

        if (consideration?.kind === "token") {
            expect(consideration?.detail.amount).toBe("3700000000000000000")
        }
    })

    it("signle-listing-with-fees", () => {
        const inputMessage = listingWithFee as any;
        const message = Seaport.parse(inputMessage);
        
        const offer = message.offer.find(_ => _.kind === "nft")
        const consideration = message.consideration.find(_ => _.kind === "token")
        
        expect(offer).not.toBeNull();
        expect(consideration).not.toBeNull();

        if (offer?.kind == "nft") {
            expect(offer?.detail.tokenId).toBe("3377")
        }

        if (consideration?.kind === "token") {
            expect(consideration?.detail.amount).toBe("3700000000000000000")
        }
    })

    it("signle-offer", () => {
        const inputMessage = offerData as any;
        const message = Seaport.parse(inputMessage);
        
        const offer = message.offer.find(_ => _.kind === "token")
        const consideration = message.consideration.find(_ => _.kind === "nft")
        
        expect(offer).not.toBeNull();
        expect(consideration).not.toBeNull();

        if (offer?.kind == "token") {
            expect(offer?.detail.amount).toBe("50000000000000000")
        }

        if (consideration?.kind === "nft") {
            expect(consideration?.detail.tokenId).toBe("7196")
        }
    })

    it("batch", () => {
        const inputMessage = batch as any;
        
        const message = Seaport.parse(inputMessage);
        const offer = message.offer.find(_ => _.kind === "nft" && _.detail.tokenId === "7906")
        
        expect(offer).not.toBeNull();
    })

    it("batch-case2", () => {
        const inputMessage = batchCase2 as any;
        const message = Seaport.parse(inputMessage);
        const offer = message.offer.find(_ => _.kind === "nft" && _.detail.tokenId === "13050")
        
        expect(offer).not.toBeNull();
    })

    it("parseFromTranscation", () => {
        const messages = Seaport.parseFromTranscation(transcationNormal);
        const first = messages[0];
        expect(first.offer.find(_ => _.kind === "nft" && _.detail.tokenId === "1461")).not.toBeNull()
        expect(first.offer.find(_ => _.kind === "nft" && _.detail.tokenId === "2350")).not.toBeNull()
    })

    it("batch-case3", () => {
        const inputMessage = case1 as any;
        const message = Seaport.parse(inputMessage);
        // console.log(message)
    })
})