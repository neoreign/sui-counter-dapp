import {
  ConnectButton,
  useSuiClient,
  useSignAndExecuteTransaction,
  useCurrentAccount,
} from '@mysten/dapp-kit';
import {
  Transaction,
} from '@mysten/sui/transactions';
import { useEffect, useState } from 'react';

// --- COUNTER CONSTANTS (Your existing working counter) ---
const COUNTER_PACKAGE_ID = '0x068a952d2a9b01b66c8817dc46b7703653e383d9d00d1c64d7336dcacc4df25b';
const COUNTER_OBJECT_ID = '0x12d4c43c867c68c97c6f6b5ca644096c57dad511a5584ec33883d30315aa6470';
const COUNTER_MODULE_NAME = 'shared_counter';

// --- FAUCET CONSTANTS (Your new NUREIN coin) ---
const NUREIN_PACKAGE_ID = '0x2b419810d774a767849478e241050dcbd7419ea1ddbdb199ddb5bdf6a30d783e';
const TREASURY_CAP_ID = '0x0e18cda046c8b930c2c93d88d9e5e9f455b4d37a3e086b6f4f0b4f7b4d4bfd21';

function App() {
  const client = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const currentAccount = useCurrentAccount();
  
  const [count, setCount] = useState(0);
  const [rpcVersion, setRpcVersion] = useState(null);

  // --- Fetch Counter Value ---
  async function fetchCount(client) {
    try {
      const object = await client.getObject({
        id: COUNTER_OBJECT_ID,
        options: { showContent: true },
      });

      if (object?.data?.content?.fields) {
        const countValue = object.data.content.fields.value;
        console.log('Current count is:', countValue);
        setCount(Number(countValue));
      }
    } catch (err) {
      console.error('Error fetching count:', err);
    }
  }

  // --- Init (Get RPC & Count) ---
  useEffect(() => {
    if (!client) return;

    async function getRpc() {
      try {
        const rpcV = await client.getRpcApiVersion();
        setRpcVersion(rpcV);
      } catch (err) {
        console.error('Error fetching RPC version:', err);
      }
    }

    getRpc();
    fetchCount(client);
  }, [client]);

  // --- Handle Increment (Counter) ---
  const handleIncrement = () => {
    if (!currentAccount) {
      alert('Please connect your wallet first!');
      return;
    }

    const txb = new Transaction();

    txb.moveCall({
      target: `${COUNTER_PACKAGE_ID}::${COUNTER_MODULE_NAME}::increment`,
      arguments: [
        txb.object(COUNTER_OBJECT_ID),
      ],
    });

    signAndExecuteTransaction(
      { transaction: txb },
      {
        onSuccess: (result) => {
          console.log('Increment successful!', result);
          alert('Increment successful!');
          fetchCount(client);
        },
        onError: (err) => {
          console.error('Transaction error:', err);
          alert('Increment failed: ' + err.message);
        },
      },
    );
  };

  // --- Handle Mint (Faucet) ---
  const handleMint = () => {
    if (!currentAccount) {
      alert('Please connect your wallet first!');
      return;
    }

    const txb = new Transaction();
    // 100 tokens * 1,000,000,000 (9 decimals)
    const MINT_AMOUNT = 100_000_000_000;

    txb.moveCall({
      target: `${NUREIN_PACKAGE_ID}::nurein::mint`,
      arguments: [
        txb.object(TREASURY_CAP_ID),              // Arg 1: TreasuryCap
        txb.pure.u64(MINT_AMOUNT),               // Arg 2: Amount
        txb.pure.address(currentAccount.address), // Arg 3: Recipient
      ],
    });

    signAndExecuteTransaction(
      { transaction: txb },
      {
        onSuccess: (result) => {
          console.log('Mint successful!', result);
          alert('Successfully minted 100 NUREIN to your wallet!');
        },
        onError: (err) => {
          console.error('Mint failed:', err);
          alert('Mint failed: ' + err.message);
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      <header className="w-full max-w-2xl flex justify-end px-4 mb-8">
        <ConnectButton />
      </header>

      <main className="w-full max-w-xl bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-2">
          My Sui Counter dApp
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Connected to Sui RPC version: {rpcVersion ?? 'Loading...'}
        </p>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Current Count</h2>
          <div className="text-6xl font-bold text-blue-500 mb-6">
            {count}
          </div>
          <button
            onClick={handleIncrement}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105"
          >
            Increment Count
          </button>
        </div>

        <hr className="border-gray-200 my-8" />

        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Nurein Token Faucet</h2>
          <p className="text-gray-600 mb-4">
            Mint 100 <strong>$NUREIN</strong> tokens directly to your wallet.
          </p>
          <button
            onClick={handleMint}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105"
          >
            Mint 100 NUREIN
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;