import { Blend } from "../../src/nft/blend"
import { OrderParameters } from "../../src/nft/blur"
import loanOffer from "./__fixtures__/loan-offer.json"


import {expect, jest, test, it, describe } from '@jest/globals';
import { parseRequest } from "../../src/index";

describe("Blend", () => {

    it("loan-offer", () => {
        const inputMessage = loanOffer as any;
        const message = Blend.parse(inputMessage);
        const offer = message.offer.find(_ => _.kind === "token")
        expect(offer).not.toBeNull();
    })
    
    it("parse-request", () => {
        const inputMessage = loanOffer as any;
        const message = parseRequest(inputMessage)
        console.log('message', message)
    })
    
})
