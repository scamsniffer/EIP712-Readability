import { Blur } from "../../src/nft/blur"
import { OrderParameters } from "../../src/nft/blur"
import listing from "./__fixtures__/listing.json"
import { Security } from "../../src/security/index"
import transcationBulk from "./__fixtures__/transaction-bulk.json"
import transcationSingle from "./__fixtures__/transaction-single.json"
import transcationByPass from "./__fixtures__/transaction-bypass.json"

import blurByPass from "./__fixtures__/listing-bypass.json"


import {expect, jest, test, it, describe } from '@jest/globals';
import { parseRequest } from "../../src/index";

describe("Blur", () => {
    it("signle-listing", () => {
        const inputMessage = listing as any;
        const message = Blur.parse(inputMessage);
        const offer = message.offer.find(_ => _.kind === "nft")
        expect(offer).not.toBeNull();
    })

    it("single", async() => {
        const messages = await Security.checkTransaction(transcationSingle);
        // expect(offer).not.toBeNull();
        // console.log("messages", messages)
    })

    it("bulk", async() => {
        const messages = await Security.checkTransaction(transcationBulk);
        // expect(offer).not.toBeNull();
        // console.log("messages", messages)
    })

    it("bypass", async() => {
        const messages = await Blur.parseFromTranscation(transcationByPass);
        const suspiciousMessages = await Security.checkTransaction(transcationByPass)
        expect(suspiciousMessages.length).not.toBe(0);
        // console.log("messages", messages[0].balanceChange)
        // console.log('suspiciousMessages', suspiciousMessages)
    })

    it("bypass-message", async() => {
        const messages = parseRequest(blurByPass as any);
        console.log("messages", messages)
    })
})

blurByPass