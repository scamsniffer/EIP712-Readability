export { Permit } from "./permit"
export { Permit2 } from "./permit2"
export { PermitLens } from "./permit-lens"

import { PermitParserAdapter, ParsedMessage, PermitMessage, TransactionLike } from "../types"
import { Permit } from "./permit"
import { Permit2 } from "./permit2"
import { PermitLens } from "./permit-lens"

const allAdapters: Array<PermitParserAdapter> = [];

allAdapters.push(Permit as PermitParserAdapter);
allAdapters.push(Permit2 as PermitParserAdapter);
allAdapters.push(PermitLens as PermitParserAdapter);

export function parsePermitFromRequest(request: any): ParsedMessage | null {
    for (let index = 0; index < allAdapters.length; index++) {
        const adapter = allAdapters[index];
        try {
            const parsedDetail = adapter.parse(request);
            return {
                kind: "permit",
                detail: parsedDetail
            }
        } catch (e) {
            // Skip error
        }
    }
    return null
}
export function parsePermitFromTranscation(transaction: TransactionLike): Array<PermitMessage> | null {
    for (let index = 0; index < allAdapters.length; index++) {
        const adapter = allAdapters[index];
        if (!adapter.parseFromTranscation) continue;
        try {
            const parsedDetail = adapter.parseFromTranscation(transaction);
            if (parsedDetail.length) {
                return parsedDetail
            }
        } catch (e) {
            // Skip error
        }
    }
    return null
}