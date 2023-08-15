# EIP712-Readability
The SDK can parse structured data from EIP-712 messages, which ensures that users understand information related to asset security before signing. This includes ERC20 approval, NFT listing, and other relevant details.

## Install
```bash
yarn add @scamsniffer/eip712-readability
```

## Usage

```typescript
import { Security, parseRequest } from "@scamsniffer/eip712-readability";

const eip721TypedMessage = ....;
const parsedMessage = parseRequest(eip721TypedMessage);

if (parsedMessage.kind === "nft") {
  // Built-in price-based NFT Listing check
  const hasIssueMesssages = await Security.checkNFTMessages([parsedMessage.detail]);
  if (hasIssueMesssages.length) {
    console.log("Suspicious messages detected")
  }
}
```


## Supported Protocols

### Permit
- [x] Permit2
- [x] ERC20 Permit
- [x] Dai Permit

### NFT Protocols

- [x] Seaport
- [x] Seaport-1.4
- [x] Blur
- [x] LooksRare
- [ ] Element
- [ ] ZeroEx-V4
