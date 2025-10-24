import { useState } from "react";
import { BrowserProvider, Contract, ethers } from "ethers";
import "./App.css";
import { pay, getPaymentStatus } from "@base-org/account";
import NFTReceiptABI from "./NFTReceiptABI.json";

const contractAddress = "0x4CF66dD38Df708Ffc86BE841f179317541c5f74E";
const merchantAddress = "0x59cA293560F3b4f92C16c26e01CA023E4577f295"; // your wallet

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

        
        

        // 3️⃣ Prepare mint data
        // const amountWei = ethers.utils.parseEther(amount.toString());
        // const txHash = payment.txHash || "mock_tx_hash";
        // const orderId = payment.id || "mock_order_id";
        // const metadataURI = "ipfs://example_receipt_metadata";
        //const amountUSDC = payment.amount; // already a string


        const amountUSDC = BigInt(Math.floor(Number(payment.amount) * 1e6));

        const txHash = payment.id || "mock_tx_hash"; // id from Base Pay
        const orderId = payment.id; // same id is fine for mock
        const metadataURI = "ipfs://example_receipt_metadata";


        // 4️⃣ Mint NFT Receipt
        await mintNFTReceipt(wallet, merchantAddress, amountUSDC, txHash, orderId, metadataURI);
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
      <h1 style={{ fontFamily: "sans-serif", fontSize: "bold", textDecorationColor: "Red" }}> This website tests the logic of kazana pay plugin because you need to pay for a wordpress sandbox. FOR THE HACKATHON!!!</h1>
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
