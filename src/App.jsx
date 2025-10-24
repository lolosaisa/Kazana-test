import { useState } from "react";
import { BrowserProvider, Contract, ethers } from "ethers";
import "./App.css";
import { pay, getPaymentStatus } from "@base-org/account";
import NFTReceiptABI from "./NFTReceiptABI.json";
import lighthouse from '@lighthouse-web3/sdk'; // ✅ Using Lighthouse instead of nft.storage

const contractAddress = "0x4CF66dD38Df708Ffc86BE841f179317541c5f74E";
const merchantAddress = "0x59cA293560F3b4f92C16c26e01CA023E4577f295"; 

function App() {
  const [status, setStatus] = useState("Idle ⏳");
  const [isPaying, setIsPaying] = useState(false);
  const [wallet, setWallet] = useState("");

  // 🔹 Prompt user to connect wallet
  async function connectWallet() {
    if (!window.ethereum) {
      alert("Please install MetaMask to continue");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setWallet(accounts[0]);
      setStatus(`Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
    } catch (err) {
      console.error(err);
      setStatus("Failed to connect wallet ❌");
    }
  }

  // 🔹 Mint NFT Receipt
  async function mintNFTReceipt(buyer, merchant, amount, txHash, orderId, metadataURI) {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new Contract(contractAddress, NFTReceiptABI, signer);

    const tx = await contract.mintReceipt(
      buyer,
      merchant,
      amount,
      txHash,
      orderId,
      metadataURI
    );

    await tx.wait();
    console.log("✅ NFT receipt minted successfully!", tx.hash);
    setStatus("🎉 NFT receipt minted successfully!");
  }

  // 🔹 Handle Payment Logic
  async function handlePayment() {
    if (!wallet) {
      alert("Connect your wallet first!");
      return;
    }

    setIsPaying(true);
    setStatus("Processing payment... 💸");

    try {
      const recipient = merchantAddress;
      const amount = "0.001";

      // 1️⃣ Trigger Base Pay
      const payment = await pay({
        amount,
        to: "0x64D1c79c00A94815f96bE31Fe0FC6356F41dB9c1",
        testnet: true
      });
      console.log("Payment sent!", payment);
      setStatus("Payment sent, waiting for confirmation...");

      // 2️⃣ Verify payment status
      const { status: payStatus } = await getPaymentStatus({
        id: payment.id,
        testnet: true,
      });

      if (payStatus === "completed" || payment.success) {
        setStatus("✅ Payment completed! Minting NFT...");
         // 3️⃣ Build metadata
        const metadata = {
          name: `KazanaPay Receipt #${payment.id}`,
          description: `Proof of purchase for order #${payment.id} via Kazana Pay.`,
          attributes: [
            { trait_type: "Buyer", value: wallet },
            { trait_type: "Merchant", value: merchantAddress },
            { trait_type: "Amount (USDC)", value: amount },
            { trait_type: "Payment ID", value: payment.id },
            { trait_type: "Status", value: payStatus },
            { trait_type: "Network", value: "Base Testnet" },
            { trait_type: "Timestamp", value: new Date().toISOString() },
          ],
        };

        console.log("🧾 Metadata created:", metadata);

        // 4️⃣ Upload metadata to IPFS using Lighthouse
        const apiKey = import.meta.env.VITE_LIGHTHOUSE_API_KEY;
        const blob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
        const uploadResponse = await lighthouse.uploadBuffer(blob, apiKey);
        const cid = uploadResponse.data.Hash;
        const metadataURI = `ipfs://${cid}`;
        console.log("📦 Metadata uploaded to IPFS via Lighthouse:", metadataURI);

        // 5️⃣ Mint NFT Receipt
        const amountUSDC = BigInt(Math.floor(Number(payment.amount) * 1e6));
        const txHash = payment.id || "mock_tx_hash";
        const orderId = payment.id;

        await mintNFTReceipt(wallet, merchantAddress, amountUSDC, txHash, orderId, metadataURI);

        console.table({
          Buyer: wallet,
          Merchant: merchantAddress,
          Amount: amount,
          PaymentID: payment.id,
          IPFS_URI: metadataURI,
          Status: payStatus,
        });
      } else {
        setStatus("⚠️ Payment still pending...");
      }
    } catch (error) {
      console.error("Payment failed:", error);
      setStatus(`❌ Error: ${error.message}`);
    }

    setIsPaying(false);
  }

  return (
    <div style={{ fontFamily: "sans-serif", textAlign: "center", padding: "2rem" }}>
      <h1>Kazana Pay Test</h1>
      <h2 style={{ fontFamily: "sans-serif", fontSize: "bold", textDecoration: "Red" }}>
        This website tests the logic of Kazana Pay plugin because you need to pay for a WordPress sandbox. <br /> FOR THE HACKATHON!!!
      </h2>
      <p>{status}</p>

      {!wallet ? (
        <button
          onClick={connectWallet}
          style={{
            padding: "1rem 2rem",
            fontSize: "1rem",
            backgroundColor: "#ffb703",
            color: "black",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            marginRight: "10px",
          }}
        >
          🔗 Connect Wallet
        </button>
      ) : (
        <button
          id="kazanaPayButton"
          onClick={handlePayment}
          disabled={isPaying}
          style={{
            padding: "1rem 2rem",
            fontSize: "1rem",
            backgroundColor: "#1a73e8",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: isPaying ? "not-allowed" : "pointer",
          }}
        >
          💸 {isPaying ? "Processing..." : "Pay with Base"}
        </button>
      )}
    </div>
  );
}

export default App;



// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
       
//       </div>
//       <h1>Kazana Test</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           Pay with Base 💸{count}
//         </button>
//         <p>
//            This is a simple test interface for Kazana Pay. Click the button below to
//   trigger the logic and check if everything is working as expected.
//         </p>
//       </div>
     
//     </>
//   )
// }

// export default App
