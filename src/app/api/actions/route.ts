import {
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  createActionHeaders,
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
  TransactionInstruction,
} from "@solana/web3.js";
import {
  toWeb3JsInstruction,
  toWeb3JsPublicKey,
  // // Keypairs
  // fromWeb3JsKeypair, toWeb3JsKeypair,
  // // Publickey
  // fromWeb3JsPublicKey, toWeb3JsPublicKey,
  // // Instructions
  // fromWeb3JsInstruction,
  // // Legacy Transactions
  // fromWeb3JsLegacyTransaction, toWeb3JsLegacyTransaction,
  // // Versioned Transactions
  // fromWeb3JsTransaction, toWeb3JsTransaction,
  // // Messages
  // fromWeb3JsMessage, toWeb3JsMessage, toWeb3JsMessageFromInput
} from "@metaplex-foundation/umi-web3js-adapters";
import {
  fetchToken,
  transferTokens,
  findAssociatedTokenPda,
  mintTokensTo,
  createAssociatedToken,
  createMint,
  createMintWithAssociatedToken,
} from "@metaplex-foundation/mpl-toolbox";
import { ACTIONS_CORS_HEADERS } from "./const";
import wallet from "/home/daniel/.solana/.config/keypari.json";
// import { mintNFTForUser } from "../nft/nft_mint_wallet";
// import { mintNFTForUser } from "../nft/nft_mint";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createNoopSigner,
  createSignerFromKeypair,
  KeypairSigner,
  none,
  publicKey,
  transactionBuilder,
  Umi,
} from "@metaplex-foundation/umi";
import {
  createMetadataAccountV3,
  createNft,
  mplTokenMetadata,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  generateSigner,
  percentAmount,
  signerIdentity,
} from "@metaplex-foundation/umi";
import {
  createCollection,
  create,
  fetchCollection,
  fetchAssetV1,
} from "@metaplex-foundation/mpl-core";
import { transferV1 } from "@metaplex-foundation/mpl-token-metadata";
import { ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, createInitializeMintInstruction, createMintToInstruction, createTransferInstruction, ExtensionType, getAssociatedTokenAddress, getMintLen, getOrCreateAssociatedTokenAccount, LENGTH_SIZE, mintTo, TOKEN_PROGRAM_ID, TYPE_SIZE } from "@solana/spl-token";
import { Console } from "console";
import base58 from "bs58";
// import base58 from "bs58";
// import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

let transactionCompleted = false; // Global boolean state

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
   const mint = generateSigner(umi); // Define the mint variable
   // Step 2: Generate token account and mint tokens
   await generateTokenAccount(umi, mint, userPubkey);

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
 
   umi.use(signerIdentity(signer));
   await nftBuilder.sendAndConfirm(umi);
   console.log("NFT created successfully!");
 
   // Step 4: Transfer the NFT
   console.log("Transferring NFT...");
   await transferNFT(
     connection,
     Gkeypair, // Payer Keypair
     mint.publicKey, // Mint address
     userPubkey.toBase58() // Recipient's public key
   );
   console.log("NFT transferred successfully!");
   return Response.json("Transfered succesfuly ! ", { headers: ACTIONS_CORS_HEADERS });
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
  } else {
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
          message: "Donation successful! Proceed to mint your NFT.",
          links: {
            next: {
              type: "inline",
              action: {
                type: "action",
                icon: "https://bafybeibqfafl757oc2ts3dnyxpapq7fthx2og2kod4cd3yeysm7q6hxaxq.ipfs.flk-ipfs.xyz",
                label: "Mint NFT",
                title: "Mint SAF Supporter NFT",
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

export const OPTIONS = async (req: Request) => {
  const headers = createActionHeaders();

  return new Response(null, { headers }); // CORS headers here
};

async function generateTokenAccount(umi: Umi, mint: KeypairSigner, payer: PublicKey) {
  console.log(`Initializing token account for mint: ${mint.publicKey}`);
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  const tx = new Transaction();
  tx.feePayer = payer;
  console.log("Fee Payer: ", tx.feePayer.toBase58());

  // Fetch the latest blockhash
  const { blockhash } = await connection.getLatestBlockhash({
    commitment: "finalized", // Faster than "finalized" with sufficient guarantees.
  });
  tx.recentBlockhash = blockhash;
  
  // Create the transaction builder
  const txBuilder = transactionBuilder()
    // Step 1: Create the mint account
    .add(
      createMint(umi, {
        mint,
        decimals: 0, // NFTs have 0 decimals
        mintAuthority: umi.identity.publicKey,
        freezeAuthority: umi.identity.publicKey,
      })
    )
    // Step 2: Create the associated token account for the mint authority
    .add(
      createAssociatedToken(umi, {
        owner: umi.identity.publicKey,
        mint: mint.publicKey,
      })
    )
    // Step 3: Mint exactly one token to the associated token account
    .add(
      mintTokensTo(umi, {
        mint: mint.publicKey,
        token: findAssociatedTokenPda(umi, {
          mint: mint.publicKey,
          owner: umi.identity.publicKey,
        }),
        amount: 1, // Ensure only 1 token is minted
      })
    );
    
    txBuilder.getInstructions().forEach(instruction => tx.add(toWeb3JsInstruction(instruction)));

 // Simulate the transaction
 const simulateResult = await connection.simulateTransaction(tx);
 console.log("Simulation Result:", simulateResult);

 // Handle simulation errors
 if (simulateResult.value.err) {
   throw new Error(
     `Simulation failed: ${JSON.stringify(simulateResult.value.err)}`
   );
 }
}

async function transferNFT(
  connection: Connection,
  payerKeypair: Keypair,
  mintAddress: string,
  recipientAddress: string
) {
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

    console.log("Destination Token Account:", destinationTokenAccount.address.toBase58());

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
    await connection.sendTransaction(tx, [payerKeypair]);
  } catch (error) {
    console.error("Error transferring NFT:", error);
  }
}

  // Set blockhash and fee payer
  // const { blockhash } = await connection.getLatestBlockhash({
  //   commitment: "finalized",
  // });
  // txBuilder.setBlockhash(blockhash);
  // txBuilder.setFeePayer(mint); // Set the fee payer explicitly

  // Convert the transaction builder to a versioned transaction for simulation
  // const web3Instructions = txBuilder.getInstructions().map(toWeb3JsInstruction);
  // const versionedTx = new Transaction({ feePayer: payer }).add(...web3Instructions); // Fee payer is required here

  // // Simulate the transaction
  // const simulateResult = await connection.simulateTransaction(versionedTx);
  // console.log("Simulation Logs:", simulateResult.value.logs);

  // if (simulateResult.value.err) {
  //   console.error("Simulation Error:", simulateResult.value.err);
  //   throw new Error(
  //     `Simulation failed: ${JSON.stringify(simulateResult.value.err)}`
  //   );
  // }

  // // If simulation passes, send and confirm the transaction
  // console.log("Simulation successful. Sending transaction...");
  // await txBuilder.sendAndConfirm(umi);

  // console.log(`Token account setup and mint completed for mint: ${mint.publicKey}`);
