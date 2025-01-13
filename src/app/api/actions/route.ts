import {
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  createPostResponse,
} from "@solana/actions";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  toWeb3JsInstruction,
} from "@metaplex-foundation/umi-web3js-adapters";
import { ACTIONS_CORS_HEADERS } from "./const";
// import wallet from "/home/daniel/.solana/.config/localwallet.json";
const wallet = JSON.parse(process.env.KEY_WALLET || '[]');
// import { mintNFTForUser } from "../nft/nft_mint_wallet";
// import { mintNFTForUser } from "../nft/nft_mint";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  none,
} from "@metaplex-foundation/umi";
import {
  createNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  generateSigner,
  percentAmount,
  signerIdentity,
} from "@metaplex-foundation/umi";

import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

let transactionCompleted = false; // Global boolean state

const wKeyTest = Keypair.fromSecretKey(new Uint8Array(wallet));
console.log("Wallet address is :", wKeyTest.publicKey.toBase58());

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const responseBody: ActionGetResponse = transactionCompleted
    ? {
        icon: "https://bafkreibllcqfjk5ch26tdq7sqotkq3xxlymivip6ta7rdjhaf2qccnzc7u.ipfs.flk-ipfs.xyz",
        description: "Thank you for your donation! You can now mint your NFT.",
        title: "Solana Ark Foundation Supporter",
        label: "Mint an NFT",
        links: {
          actions: [
            {
              type: "transaction",
              label: "Mint NFT",
              href: requestUrl.origin + "/api/actions?action=mint",
            },
          ],
        },
      }
    : {
        //icon: "https://bafybeibqfafl757oc2ts3dnyxpapq7fthx2og2kod4cd3yeysm7q6hxaxq.ipfs.flk-ipfs.xyz",
        icon: "https://bafkreibllcqfjk5ch26tdq7sqotkq3xxlymivip6ta7rdjhaf2qccnzc7u.ipfs.flk-ipfs.xyz",
        description:
          "The time to act is now! ... before their silence becomes our legacy.",
        title: "Solana Ark Foundation Supporter",
        label: "Make a donation",
        links: {
          actions: [
            {
              type: "transaction",
              label: "Send 0.05 Sol",
              href: requestUrl.origin + "/api/actions?action=send0.05",
            },
            {
              type: "transaction",
              label: "Send 1 Sol",
              href: requestUrl.origin + "/api/actions?action=send1",
            },
            {
              type: "transaction",
              label: "Send Sol",
              href:
                requestUrl.origin + "/api/actions?action=send&amount=0.0001",
              parameters: [
                {
                  name: "amount",
                  label: "Enter the amount of SOL to send",
                  required: true,
                },
              ],
            },
          ],
        },
      };

  return Response.json(responseBody, { headers: ACTIONS_CORS_HEADERS });
}

export async function POST(request: Request) {
  const requestBody: ActionPostRequest = await request.json();
  let userPubkey: PublicKey;
  try {
    userPubkey = new PublicKey(requestBody.account);
  } catch (err) {
    return new Response('Invalid "account" provided', {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const param = url.searchParams.get("amount");

  const RPC_ENDPOINT = "https://api.devnet.solana.com";
  const umi = createUmi(RPC_ENDPOINT);

  // Create a no-op signer using the user's public key
  // const umiPublicKey = publicKey(userPubkey.toBase58());
  // const umiSigner = createNoopSigner(umiPublicKey);
  // Convert it using the UmiWeb3jsAdapters Package
  // const web3jsPublickey = toWeb3JsPublicKey(umiPublicKey);
  const Gkeypair = Keypair.fromSecretKey(new Uint8Array(wallet));

  let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
  const signer = createSignerFromKeypair(umi, keypair);
  umi.use(signerIdentity(signer));
  umi.use(mplTokenMetadata());
  umi.use(signerIdentity(signer));

  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // Prepare a new transaction
  const tx = new Transaction();
  tx.feePayer = userPubkey;
  console.log("Fee Payer: ", tx.feePayer.toBase58());

  // Fetch the latest blockhash
  const { blockhash } = await connection.getLatestBlockhash({
    commitment: "finalized", // Faster than "finalized" with sufficient guarantees.
  });
  tx.recentBlockhash = blockhash;
  
  const mint = generateSigner(umi); // Define the mint variable
  // Step 2: Generate token account and mint tokens
  // await generateTokenAccount(umi, mint, userPubkey);

  // Step 3: Create the NFT
  const nftBuilder = createNft(umi, {
    name: "SAF Supporter Badge",
    symbol: "SAF",
    uri: "https://devnet.irys.xyz/ERXUytdJNnNGXHkTFbKBMaHe6dQbTE36cuXtgCxw2fgy",
    mint,
    sellerFeeBasisPoints: percentAmount(0, 2),
    updateAuthority: signer.publicKey,
    creators: [
      {
        address: signer.publicKey,
        verified: true,
        share: 100,
      },
    ],
    primarySaleHappened: false,
    isMutable: true,
    collection: none(),
    uses: none(),
  });

  // Handle action types
  if (action === "send0.05" || action === "send1" || action === "send") {
    const lamports =
      action === "send0.05"
        ? 50000000
        : action === "send1"
        ? 1000000000
        : Math.round(parseFloat(param || "0") * LAMPORTS_PER_SOL);

    const transferInstruction = SystemProgram.transfer({
      fromPubkey: userPubkey,
      toPubkey: new PublicKey("BN8LeCtMenajmBbzRKqkPFcP2hAJjrtCFfd4XmUqxJ9G"),
      lamports,
    });

    tx.add(transferInstruction);
  } else if (action === "mint") {
    try {
    

      // Extract instructions from the NFT builder
      const instructions = nftBuilder.getInstructions();

      // Convert and add the instructions to the transaction
      instructions.forEach((instruction) =>
        tx.add(toWeb3JsInstruction(instruction))
      );

      const transactionNFTFee = await estimateTransactionCost(connection, tx);
      
      const transferTx = await transferNFT(
        connection,
        Gkeypair, // Payer Keypair
        mint.publicKey, // Mint address
        userPubkey.toBase58(), // Recipient's public key
        false
      );

      let transactionTransferFee = 0;
      if (transferTx) {
        transactionTransferFee = await estimateTransactionCost(
          connection,
          transferTx
        );
      }

      //pay transaction fees
      const txFeeLamports = (transactionNFTFee + transactionTransferFee)+33000000;
      console.log("Acumulated Transaction Fee: ", txFeeLamports);

      const txFee = new Transaction();
      txFee.feePayer = userPubkey;
      console.log("Fee Payer: ", txFee.feePayer.toBase58());

      // Fetch the latest blockhash
      const { blockhash } = await connection.getLatestBlockhash({
        commitment: "finalized", // Faster than "finalized" with sufficient guarantees.
      });
      txFee.recentBlockhash = blockhash;

      const transferInstruction = SystemProgram.transfer({
        fromPubkey: userPubkey,
        toPubkey: Gkeypair.publicKey,
        lamports: txFeeLamports,
      });

      txFee.add(transferInstruction);

      const responseBody: ActionPostResponse = await createPostResponse({
        fields: {
          type: "transaction",
          transaction: txFee,
          message: "NFT Minted successfuly!",
          links: {
            next: {
              type: "inline",
              action: {
                type: "action",
                icon: "https://bafybeibqfafl757oc2ts3dnyxpapq7fthx2og2kod4cd3yeysm7q6hxaxq.ipfs.flk-ipfs.xyz",
                label: "NFT Minted completed !",
                title: "NFT Minted Successfully !",
                disabled: false,
                description: "You can now proceed to transfer the NFT to your wallet. Transfer is free of charge, transaction fees are on us !",
                links: {
                  actions: [
                    {
                      type: "transaction",
                      label: "Transfer NFT !",
                      href: "/api/actions?action=feePayed",
                    },
                  ],
                },
              },
            },
          },
        },
      });
    
       return Response.json(responseBody, { headers: ACTIONS_CORS_HEADERS });
    } catch (error) {
      console.error("Minting error: ", error);
      return new Response(
        JSON.stringify({
          error: "Minting error",
          details: error instanceof Error ? error.message : "Unknown error",
        }),
        { status: 500, headers: ACTIONS_CORS_HEADERS }
      );
    }
  } else if(action ===  "feePayed"){

    console.log("Executing the rest of the transaction !")

    umi.use(signerIdentity(signer));
    await nftBuilder.sendAndConfirm(umi);
    console.log("NFT created successfully!");

    const transferTx = await transferNFT(
      connection,
      Gkeypair, // Payer Keypair
      mint.publicKey, // Mint address
      userPubkey.toBase58(), // Recipient's public key
      true
    );

    const response = ({
        type: 'post',
        message:'Thank you for your donation! You can now check your wallet.',
      } satisfies ActionPostResponse);
    
     return Response.json(response, { headers: ACTIONS_CORS_HEADERS });
  }else {
    return Response.json("400", { headers: ACTIONS_CORS_HEADERS });
  }

  try {
    // Simulate transaction processing
    if (action.startsWith("send")) {
      transactionCompleted = true; // Update the global state

      const responseBody: ActionPostResponse = await createPostResponse({
        fields: {
          type: "transaction",
          transaction: tx,
          message: "Donation successful ! You can now proceed to mint your NFT Supporter Badge. Please note, transaction fees will be covered by you to complete the minting process.",
          links: {
            next: {
              type: "inline",
              action: {
                type: "action",
                icon: "https://bafybeibqfafl757oc2ts3dnyxpapq7fthx2og2kod4cd3yeysm7q6hxaxq.ipfs.flk-ipfs.xyz",
                label: "Mint NFT",
                title: "Mint SAF Supporter Badge NFT",
                disabled: false,
                description: "Mint your Solana Ark Foundation Supporter Badge.",
                links: {
                  actions: [
                    {
                      type: "transaction",
                      label: "Mint NFT",
                      href: url.origin + "/api/actions?action=mint",
                    },
                  ],
                },
              },
            },
          },
        },
      });

      return Response.json(responseBody, { headers: ACTIONS_CORS_HEADERS });
    }
  } catch (error) {
    return Response.json(
      { error: "Transaction error", details: (error as any).message },
      { headers: ACTIONS_CORS_HEADERS }
    );
  }
  
  // Serialize the transaction
  const serializedTx = tx
    .serialize({
      requireAllSignatures: false, // Let Blink handle the signing
      verifySignatures: false,
    })
    .toString("base64");

  //     const retryTxId = await connection.sendRawTransaction(Buffer.from(serializedTx, 'base64'));
  // console.log("Retry Transaction ID:", retryTxId);

  console.log("Serialized Transaction: ", serializedTx);

  // Return the serialized transaction for Blink to sign
  return Response.json(
    {
      type: "transaction",
      transaction: serializedTx,
      message: "Transaction prepared and serialized successfully.",
    },
    { headers: ACTIONS_CORS_HEADERS }
  );
}

export const OPTIONS = async () => {

  return new Response(null,{ headers: ACTIONS_CORS_HEADERS }); // CORS headers here
};

async function transferNFT(
  connection: Connection,
  payerKeypair: Keypair,
  mintAddress: string,
  recipientAddress: string,
  execute: boolean = false
) {
  if (execute) {
    try {
      const mint = new PublicKey(mintAddress);
      const recipient = new PublicKey(recipientAddress);

      // Ensure the destination token account exists
      const destinationTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payerKeypair,
        mint,
        recipient
      );

      console.log(
        "Destination Token Account:",
        destinationTokenAccount.address.toBase58()
      );

      // Get the source token account
      const sourceTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payerKeypair,
        mint,
        payerKeypair.publicKey
      );

      // Create transfer instruction
      const transferInstruction = createTransferInstruction(
        sourceTokenAccount.address,
        destinationTokenAccount.address,
        payerKeypair.publicKey,
        1 // Number of tokens (1 for NFTs)
      );

      // Send the transaction
      const tx = new Transaction().add(transferInstruction);

      // Fetch the latest blockhash
      const { blockhash } = await connection.getLatestBlockhash({
        commitment: "finalized", // Faster than "finalized" with sufficient guarantees.
      });

      tx.recentBlockhash = blockhash;
      tx.feePayer = payerKeypair.publicKey;

      await connection.sendTransaction(tx, [payerKeypair]);

      return tx;
      //await connection.sendTransaction(tx, [payerKeypair]);
    } catch (error) {
      console.error("Error transferring NFT:", error);
    }
  } else {
    const tx = new Transaction();
    try {
      const mint = new PublicKey(mintAddress);
      const recipient = new PublicKey(recipientAddress);

      // Simulate token account creation without requiring the actual token account
      const destinationTokenAccount = await getAssociatedTokenAddress(
        mint,
        recipient
      );

      // Use a pre-defined or dummy source token account for estimation
      const sourceTokenAccount = await getAssociatedTokenAddress(
        mint,
        payerKeypair.publicKey
      );

      // Create transfer instruction
      const transferInstruction = createTransferInstruction(
        sourceTokenAccount,
        destinationTokenAccount,
        payerKeypair.publicKey,
        1 // Number of tokens (1 for NFTs)
      );

      // Construct the transaction
      tx.add(transferInstruction);

      // Fetch the latest blockhash
      const { blockhash } = await connection.getLatestBlockhash({
        commitment: "finalized", // Faster than "finalized" with sufficient guarantees.
      });

      tx.recentBlockhash = blockhash;
      tx.feePayer = payerKeypair.publicKey;

      // Estimate the fee
      const message = tx.compileMessage();
      const feeCalculator = await connection.getFeeForMessage(message);

      if (feeCalculator.value !== null) {
        console.log(
          `Estimated Transaction Fee: ${
            feeCalculator.value / LAMPORTS_PER_SOL
          } SOL`
        );
        return tx;
      } else {
        console.error("Could not estimate transaction fee.");
        return tx;
      }
    } catch (error) {
      console.error("Error estimating NFT transfer cost:", error);
      return tx;
    }
  }
}

async function estimateTransactionCost(
  connection: Connection,
  tx: Transaction
) {
  ``;
  // **Estimate the Fee**
  // 1. Compile the message
  const message = tx.compileMessage();

  // 2. Fetch the estimated fees
  const feeCalculator = await connection.getFeeForMessage(message);

  if (feeCalculator.value !== null) {
    console.log(
      `Estimated Transaction Fee: ${feeCalculator.value / LAMPORTS_PER_SOL} SOL`
    );
    return feeCalculator.value;
  }
  return 0;
}

