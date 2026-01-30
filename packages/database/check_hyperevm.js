
const { createPublicClient, http, parseAbi, formatEther } = require('viem');

const HYPEREVM_RPC = 'https://rpc.hyperliquid.xyz/evm';
const ADDRESS = '0x4e814De1E6A46aba627f387b38664e50cbB3899C';
const BLT_ADDRESS = '0xFEF20Fd2422a9d47Fe1a8C355A1AE83F04025EDF';

const client = createPublicClient({
    transport: http(HYPEREVM_RPC)
});

const ERC20_ABI = parseAbi([
    'function balanceOf(address account) view returns (uint256)',
    'function decimals() view returns (uint8)'
]);

async function main() {
    console.log(`Checking ${ADDRESS} on Hyperevm...`);

    // Check Native Balance
    const balance = await client.getBalance({ address: ADDRESS });
    console.log(`Native (HYPE) Balance: ${formatEther(balance)} HYPE`);

    // Check BLT Balance
    const bltBalance = await client.readContract({
        address: BLT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [ADDRESS]
    });
    console.log(`BLT Balance: ${bltBalance.toString()} (raw)`);

    const block = await client.getBlockNumber();
    console.log(`Current Block: ${block}`);
}

main().catch(console.error);
