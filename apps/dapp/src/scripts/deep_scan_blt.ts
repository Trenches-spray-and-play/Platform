
import { createPublicClient, http, parseAbi, Address, formatUnits } from 'viem';

const HYPEREVM_RPC = 'https://rpc.hyperliquid.xyz/evm';
const ADDRESS = '0x4e814De1E6A46aba627f387b38664e50cbB3899C';
const BLT_ADDRESS = '0xFEF20Fd2422a9d47Fe1a8C355A1AE83F04025EDF';

const client = createPublicClient({
    transport: http(HYPEREVM_RPC)
});

const ERC20_ABI = parseAbi([
    'event Transfer(address indexed from, address indexed to, uint256 value)',
]);

async function main() {
    console.log(`Deep scanning ${ADDRESS} on Hyperevm for BLT...`);

    const currentBlock = await client.getBlockNumber();
    console.log(`Current Block: ${currentBlock}`);

    // Scan last 30,000 blocks (~8 hours)
    const totalToScan = 30000;
    const chunkSize = 1000;

    for (let i = 0; i < totalToScan; i += chunkSize) {
        const toBlock = currentBlock - BigInt(i);
        const fromBlock = toBlock - BigInt(chunkSize);

        try {
            const logs = await client.getLogs({
                address: BLT_ADDRESS,
                event: ERC20_ABI[0],
                args: { to: ADDRESS },
                fromBlock,
                toBlock,
            });

            if (logs.length > 0) {
                console.log(`Found ${logs.length} transfers in range ${fromBlock}-${toBlock}:`);
                logs.forEach(log => {
                    console.log(`- TX: ${log.transactionHash}, Amount: ${formatUnits(log.args.value || 0n, 18)} BLT, Block: ${log.blockNumber}`);
                });
            }
        } catch (err: any) {
            console.error(`Error in range ${fromBlock}-${toBlock}:`, err.message);
        }
    }
}

main().catch(console.error);
