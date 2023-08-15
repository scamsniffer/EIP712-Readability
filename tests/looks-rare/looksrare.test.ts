import { LooksRare } from "../../src/nft/looksrare"
import { MakerOrder } from "../../src/nft/looksrare"
import listing from "./__fixtures__/listing.json"

describe("LooksRare", () => {
    it("signle-listing", () => {
        const inputMessage = listing as any;
        const parseResult = LooksRare.parse(inputMessage);
        // console.log(parseResult)
    })
})