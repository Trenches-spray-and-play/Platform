# HyperEVM Infrastructure Configuration

> **Status**: ACTIVE
> 
> **Purpose**: Blockchain infrastructure truth source for Trenches

---

## Production Network

| Field | Value |
|-------|-------|
| **Primary RPC** | `https://rpc.hyperliquid.xyz/evm` |
| **Chain ID** | `999` |
| **Currency Symbol** | `HYPE` |
| **Block Explorer** | `https://hypurrscan.io` |

---

## Alternative RPC Endpoints

Use if primary is congested or rate-limited:

| Provider | URL |
|----------|-----|
| 1RPC (Privacy) | `https://1rpc.io/hyperliquid` |
| dRPC | `https://hyperliquid.drpc.org` |
| Hypurrscan | `https://rpc.hypurrscan.io` |
| Tatum | `https://hyperevm-mainnet.gateway.tatum.io` |

---

## BLT Token Contract

```
0xFEF20Fd2422a9d47Fe1a8C355A1AE83F04025EDF
```

---

## Network Specifications

- **Gas Token**: HYPE (must transfer from HyperCore L1 to EVM layer)
- **EVM Compatibility**: Cancun hardfork (without blobs), EIP-1559
- **Block System**: Dual-block (1s small blocks, 60s big blocks)
- **Rate Limits**: ~100 req/min per IP on public RPC

---

## Environment Variables

```env
HYPEREVM_RPC_URL=https://rpc.hyperliquid.xyz/evm
HYPEREVM_CHAIN_ID=999
BLT_CONTRACT_ADDRESS=0xFEF20Fd2422a9d47Fe1a8C355A1AE83F04025EDF
```
