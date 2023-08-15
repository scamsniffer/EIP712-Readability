import { Permit } from "../../src/permit/permit"
import { Permit2 } from "../../src/permit/permit2"
import { parsePermitFromRequest, parsePermitFromTranscation } from "../../src/permit/index"
import permitMessage from "./__fixtures__/permit.json"
import permitBatchMessage from "./__fixtures__/permit-batch.json"
import permitForAllMessage from "./__fixtures__/permit-for-all.json"
import permitBatch2Message from "./__fixtures__/permit-batch-2.json"
import transcation from "./__fixtures__/transcation.json"
import transcationPermit from "./__fixtures__/transcation-permit.json"

import {expect, describe, it, jest, test} from '@jest/globals';

describe("Permit", () => {

    it("permit", () => {
        const inputMessage = permitMessage as any;
        const message = Permit.parse(inputMessage);
        // console.log(message)
    })

    it("batch-permit2", () => {
        const inputMessage = permitBatchMessage as any;
        const message = parsePermitFromRequest(inputMessage);
        console.log(message)
    })

    it("second-batch-permit2", () => {
        const inputMessage = permitBatch2Message as any;
        const message = parsePermitFromRequest(inputMessage);
        console.log(message)
    })

    it("lens-permit2", () => {
        const inputMessage = permitForAllMessage as any;
        const message = parsePermitFromRequest(inputMessage);
        console.log(message)
    })

    it("permit2-parseFromTranscation", () => {
        const messages = Permit2.parseFromTranscation(transcation);
        expect(messages.length).toBe(1)
        expect(messages[0].permits[0].spender).toBe("0x00009316616f21175ea0046244f684e959570000")
    })

    it("permit-parseFromTranscation", () => {
        const messages = Permit.parseFromTranscation(transcationPermit);
        // console.log("messages", messages[0])
        expect(messages.length).toBe(1)
        expect(messages[0].permits[0].spender).toBe("0x49Dc14Dd851B6EaE8d685715e12a06cc1BFC5d8d")
    })

    it("parsePermitFromTranscation", () => {
        const messages = parsePermitFromTranscation(transcationPermit);
        if (messages) {
            expect(messages.length).toBe(1)
            expect(messages[0].permits[0].spender).toBe("0x49Dc14Dd851B6EaE8d685715e12a06cc1BFC5d8d")
        }
    })

    it("parsePermitFromTranscation-permit2", () => {
        const messages = parsePermitFromTranscation(transcation);
        console.log("messages", messages)
        if (messages) {
            expect(messages.length).toBe(1)
            expect(messages[0].permits[0].spender).toBe("0x00009316616f21175ea0046244f684e959570000")
        }
    })

})