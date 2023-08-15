import { Security } from "../../src/security/index"
import transcation from "../seaport/__fixtures__/transcation.json"
import transcationNormal from "../seaport/__fixtures__/transcation-normal.json"
import transcationNormal2 from "../seaport/__fixtures__/transcation-normal2.json"
import bulkOrderBad from "../seaport-v1.4/__fixtures__/bulk-order-bad.json"
import bulkOrder from "../seaport-v1.4/__fixtures__/bulk-order.json"
import fp from "../seaport/__fixtures__/fp.json"
import fp2 from "../seaport/__fixtures__/fp2.json"
import transcationPriceNormal from "../blur/__fixtures__/listing.json"
import transcationPriceLow from "../blur/__fixtures__/listing-low.json"
import offerPrivate from "../seaport/__fixtures__/offer-private.json"
import txBulk2 from "../blur/__fixtures__/transaction-bulk-2.json"

import {expect, jest, test, it, describe } from '@jest/globals';

jest.setTimeout(1000 * 1000)

describe("Security", () => {
   
    it("suscipious", async() => {
        const messages = await Security.checkTransaction(transcation);
        expect(messages.length).toBe(1)
    })

    it("normal1", async() => {
        const messages = await Security.checkTransaction(transcationNormal);
        // console.log('messages', messages)
        expect(messages.length).toBe(0)
    })

    it("normal2", async() => {
        const messages = await Security.checkTransaction(transcationNormal2);
        expect(messages.length).toBe(0)
    })

    it("suscipiousPirceLow", async() => {
        const messages = await Security.checkMessage(transcationPriceLow);
        expect(messages).not.toBe(undefined)
    })

    it("suscipiousPriceNormal", async() => {
        const messages = await Security.checkMessage(transcationPriceNormal);
        expect(messages).toBe(undefined)
    })

    it("fo", async() => {
        const messages = await Security.checkMessage(fp);
        // console.log(messages)
        // expect(messages).toBe(undefined)
    })


    it("fp2", async() => {
        const messages = await Security.checkMessage(fp2);
        // console.log(messages)
        // expect(messages).toBe(undefined)
    })


    it("seaport-bulk-order", async() => {
        const messages = await Security.checkMessage(bulkOrderBad);
        expect(messages).not.toBe(undefined)
    })

    it("seaport-bulk-order-normal", async() => {
        const messages = await Security.checkMessage(bulkOrder);
        expect(messages).toBe(undefined)
    })

    // it("offerPrivate", async() => {
    //     const messages = await Security.checkMessage(offerPrivate);
    //     console.log(messages)
    //     expect(messages).toBe(undefined)
    // })

    it("blur-bulk-execute", async() => {
        const messages = await Security.checkTransaction(txBulk2);
        expect(messages.length).not.toBe(0)
    })
})