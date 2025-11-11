// src/App.jsx
import {
  ConnectButton,
  useSuiClient,
  useSignAndExecuteTransaction,
} from '@mysten/dapp-kit';
import {
  Transaction,
} from '@mysten/sui/transactions';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// --- YOUR VALUES ---
const PACKAGE_ID = '0x068a952d2a9b01b66c8817dc46b7703653e383d9d00d1c64d7336dcacc4df25b';
const COUNTER_OBJECT_ID = '0x12d4c43c867c68c97c6f6b5ca644096c57dad511a5584ec33883d30315aa6470';
const MODULE_NAME = 'shared_counter'; 
// --- END OF VALUES ---

function App() {
  const client = useSuiClient();
  const { mutate: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();
  const [count, setCount] = useState(0); // This will start at 0
  const [rpcVersion, setRpcVersion] = useState(null);

  async function fetchCount(client) {
    console.log('Fetching count...');
    try {
      const object = await client.getObject({
        id: COUNTER_OBJECT_ID,
        options: { showContent: true },
      });

      if (object?.data?.content?.fields) {
        // 💡💡💡 FIX 1: Change 'count' to 'value' to match your Move struct
        const countValue = object.data.content.fields.value; 
        console.log('Current count is:', countValue);
        setCount(Number(countValue)); // Store it in our state
      } else {
        console.warn('Could not read count from object');
      }
    } catch (err) {
      console.error('Error fetching count:', err);
    }
  }

  useEffect(() => {
    if (!client) {
      return;
    }

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

  const handleIncrement = () => {
    if (!client) {
      alert('Client not ready. Please connect your wallet.');
      return;
    }

    const txb = new Transaction();

    txb.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::increment`,
      arguments: [
        // 💡💡💡 FIX 2: Add 'txb.object()' wrapper back.
        // The validator expects an object reference.
        txb.object(COUNTER_OBJECT_ID), 
      ],
    });

    signAndExecuteTransaction(
      {
        transaction: txb,
      },
      {
        onSuccess: (result) => {
          console.log('Transaction successful!', result);
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

  return (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white text-gray-800">
    <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 text-center border border-gray-100">
      <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-3">
        My Sui Counter dApp
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Connected to Sui RPC version: {rpcVersion || "Loading..."}
      </p>

      <hr className="my-6" />

      <motion.div
        key={count}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 150 }}
      >
        <h2 className="text-2xl font-bold mb-2">Current Count:</h2>
        <p className="text-5xl font-extrabold text-blue-600">{count}</p>
      </motion.div>

      <div className="space-y-4">
  <button
    onClick={handleIncrement}
    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-2 px-6 rounded-xl hover:opacity-90 transition"
  >
    Increment Count
  </button>
  
  <ConnectButton className="w-full" />
</div>
    </div>
  </div>
);
}
export default App;