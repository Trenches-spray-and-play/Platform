import { createPublicClient, http, parseAbi, Address } from 'viem';
import { config } from '@/lib/config';
import { matchTransferToEntry, transactionHashExists } from './transaction.service';

// ERC20 Transfer event ABI
const ERC20_ABI = parseAbi([
  'event Transfer(address indexed from, address indexed to, uint256 value)',
]);

let publicClient: ReturnType<typeof createPublicClient> | null = null;
let isMonitoring = false;
let lastProcessedBlock: bigint | null = null;

/**
 * Initialize blockchain connection
 */
export function initializeBlockchain() {
  if (!config.hyperevmRpcUrl) {
    console.warn('HYPEREVM_RPC_URL not set, blockchain monitoring disabled');
    return false;
  }

  try {
    publicClient = createPublicClient({
      transport: http(config.hyperevmRpcUrl),
    });

    console.log('Blockchain client initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize blockchain client:', error);
    return false;
  }
}

/**
 * Get the latest block number
 */
async function getLatestBlockNumber(): Promise<bigint> {
  if (!publicClient) {
    throw new Error('Blockchain client not initialized');
  }

  return await publicClient.getBlockNumber();
}

/**
 * Process a single Transfer event
 */
async function processTransferEvent(
  from: Address,
  to: Address,
  value: bigint,
  txHash: string,
  blockNumber: bigint
) {
  try {
    // Check if we've already processed this transaction
    if (await transactionHashExists(txHash)) {
      console.log(`Transaction ${txHash} already processed, skipping`);
      return;
    }

    // Get block timestamp
    if (!publicClient) return;
    const block = await publicClient.getBlock({ blockNumber });
    const timestamp = new Date(Number(block.timestamp) * 1000);

    // Try to match this transfer to a pending entry
    const matched = await matchTransferToEntry({
      txHash,
      fromAddress: from,
      toAddress: to,
      amount: value,
      blockNumber: Number(blockNumber),
      timestamp,
    });

    if (matched) {
      console.log(`✅ Matched transaction ${txHash} to entry ${matched.id}`);
    } else {
      console.log(`⚠️  Transfer ${txHash} to ${to} not matched to any pending entry`);
    }
  } catch (error) {
    console.error(`Error processing transfer ${txHash}:`, error);
  }
}

/**
 * Scan a block range for Transfer events
 */
async function scanBlockRange(fromBlock: bigint, toBlock: bigint) {
  if (!publicClient) return;

  const bltAddress = config.bltContractAddress as Address;

  try {
    const logs = await publicClient.getLogs({
      address: bltAddress,
      event: ERC20_ABI[0],
      fromBlock,
      toBlock,
    });

    console.log(`Scanning blocks ${fromBlock} to ${toBlock}: Found ${logs.length} transfers`);

    for (const log of logs) {
      if (log.args.from && log.args.to && log.args.value) {
        await processTransferEvent(
          log.args.from,
          log.args.to,
          log.args.value,
          log.transactionHash,
          log.blockNumber
        );
      }
    }

    lastProcessedBlock = toBlock;
  } catch (error) {
    console.error(`Error scanning blocks ${fromBlock}-${toBlock}:`, error);
  }
}

/**
 * Start monitoring blockchain for new transfers
 */
export async function startMonitoring() {
  if (isMonitoring) {
    console.log('Blockchain monitoring already started');
    return;
  }

  if (!publicClient) {
    if (!initializeBlockchain()) {
      return;
    }
  }

  isMonitoring = true;
  console.log('Starting blockchain monitoring...');

  // Initialize last processed block
  if (lastProcessedBlock === null) {
    lastProcessedBlock = await getLatestBlockNumber();
    console.log(`Starting from block ${lastProcessedBlock}`);
  }

  // Poll for new blocks
  const pollInterval = setInterval(async () => {
    if (!isMonitoring) {
      clearInterval(pollInterval);
      return;
    }

    try {
      const latestBlock = await getLatestBlockNumber();
      
      if (latestBlock > lastProcessedBlock!) {
        const fromBlock = lastProcessedBlock! + 1n;
        await scanBlockRange(fromBlock, latestBlock);
      }
    } catch (error) {
      console.error('Error in blockchain polling:', error);
    }
  }, config.pollingInterval * 1000);

  // Store interval ID for cleanup
  (globalThis as any).__blockchainPollInterval = pollInterval;
}

/**
 * Stop monitoring blockchain
 */
export function stopMonitoring() {
  isMonitoring = false;
  
  if ((globalThis as any).__blockchainPollInterval) {
    clearInterval((globalThis as any).__blockchainPollInterval);
    delete (globalThis as any).__blockchainPollInterval;
  }

  console.log('Blockchain monitoring stopped');
}

/**
 * Manually trigger a scan of recent blocks (for testing/debugging)
 */
export async function scanRecentBlocks(blockCount: number = 10) {
  if (!publicClient) {
    if (!initializeBlockchain()) {
      throw new Error('Blockchain client not initialized');
    }
  }

  const latestBlock = await getLatestBlockNumber();
  const fromBlock = latestBlock - BigInt(blockCount);

  console.log(`Manually scanning blocks ${fromBlock} to ${latestBlock}`);
  await scanBlockRange(fromBlock, latestBlock);
}
