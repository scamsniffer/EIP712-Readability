import fecth from "isomorphic-fetch";

export class ScamSnifferRegistry {

    static async getPrice(ids: string[]) {
        const uniqueIds = Array.from(new Set(ids))
        const apiUrl = 'https://lookup-api.scamsniffer.io/price?ids=' + uniqueIds.join(',')
        const data = await fecth(apiUrl)
            .then(_ => _.json());
        return data;
    }
}