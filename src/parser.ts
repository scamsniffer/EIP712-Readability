
import * as nft from "./nft"
import * as permit from "./permit"
import { EIP712Like, ParsedMessage } from "./types"

export function parseRequest(request: EIP712Like) : ParsedMessage | null {
    let match = nft.parseRequest(request);
    if (!match) {
    }

    return match
}