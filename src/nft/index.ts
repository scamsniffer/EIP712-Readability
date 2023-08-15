
export { Seaport } from "./seaport"
export { Blur } from "./blur"
export { LooksRare } from "./looksrare"
export { SeaportV14 } from "./seaport-v1.4"
export { Blend } from "./blend"

import { Blur } from "./blur"
import { Seaport } from "./seaport"
import { LooksRare } from "./looksrare"
import { SeaportV14 } from "./seaport-v1.4"
import { Blend } from "./blend"
import { ParserAdapter, ParsedMessage } from "../types"

const allAdapters: Array<ParserAdapter> = [];

allAdapters.push(Seaport as ParserAdapter);
allAdapters.push(Blur as ParserAdapter);
allAdapters.push(LooksRare as unknown as ParserAdapter);
allAdapters.push(SeaportV14 as unknown as ParserAdapter);
allAdapters.push(Blend as unknown as ParserAdapter);

export function parseRequest(request: any) : ParsedMessage | null {
    for (let index = 0; index < allAdapters.length; index++) {
        const adapter = allAdapters[index];
       try {
            const parsedDetail = adapter.parse(request);
            return {
                kind: "nft",
                detail: parsedDetail
            }
       } catch (e) {
       }
    }
    return null
}