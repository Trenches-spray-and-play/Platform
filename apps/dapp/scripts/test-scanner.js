const { PrismaClient } = require('@prisma/client');
const { createPublicClient, http, parseAbi } = require('viem');

const prisma = new PrismaClient();

const BLT_TOKEN = '0xFEF20Fd2422a9d47Fe1a8C355A1AE83F04025EDF';
const DEPOSIT_ADDRESS = '0x4e814De1E6A46aba627f387b38664e50cbB3899C';
const RPC_URL = 'https://rpc.hyperliquid.xyz/evm';

const ERC20_ABI = parseAbi([
  'event Transfer(address indexed from, address indexed to, uint256 value)',
]);

async function testScan() {
  try {
    console.log('Testing HyperEVM scanner...');
    console.log('Deposit address:', DEPOSIT_ADDRESS);
    console.log('BLT token:', BLT_TOKEN);
    console.log('');
    
    const client = createPublicClient({
      transport: http(RPC_URL),
    });
    
    const currentBlock = await client.getBlockNumber();
    const fromBlock = currentBlock - BigInt(500); // Scan 500 blocks
    
    console.log('Current block:', currentBlock.toString());
    console.log('Scanning from block:', fromBlock.toString());
    console.log('Blocks to scan:', (currentBlock - fromBlock).toString());
    console.log('');
    
    console.log('Fetching Transfer events to deposit address...');
    const logs = await client.getLogs({
      address: BLT_TOKEN,
      event: ERC20_ABI[0],
      args: { to: DEPOSIT_ADDRESS },
      fromBlock,
      toBlock: currentBlock,
    });
    
    console.log('Found', logs.length, 'transfer events');
    console.log('');
    
    for (const log of logs) {
      console.log('Transaction:', log.transactionHash);
      console.log('  From:', log.args.from);
      console.log('  To:', log.args.to);
      console.log('  Amount:', log.args.value?.toString());
      console.log('  Block:', log.blockNumber.toString());
      console.log('');
      
      // Check if already in DB
      const existing = await prisma.deposit.findFirst({
        where: { txHash: { equals: log.transactionHash, mode: 'insensitive' } }
      });
      
      if (existing) {
        console.log('  -> Already in database:', existing.status);
      } else {
        console.log('  -> NEW DEPOSIT NOT IN DATABASE');
      }
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testScan();
