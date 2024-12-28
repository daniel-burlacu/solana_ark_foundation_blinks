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
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { 
  toWeb3JsInstruction
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
} from '@metaplex-foundation/umi-web3js-adapters';
import { ACTIONS_CORS_HEADERS } from "./const";
// import wallet from "/home/daniel/.solana/.config/keypari.json";
// import { mintNFTForUser } from "../nft/nft_mint_wallet";
// import { mintNFTForUser } from "../nft/nft_mint";
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { createNoopSigner, publicKey} from "@metaplex-foundation/umi"
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { generateSigner, percentAmount, signerIdentity } from "@metaplex-foundation/umi";
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
  const umiPublicKey = publicKey(userPubkey.toBase58());
  const signer = createNoopSigner(umiPublicKey);
  // let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
  // const signer = createSignerFromKeypair(umi, keypair);
  umi.use(
    signerIdentity({
        publicKey: publicKey(signer),
        signTransaction: async (tx) => tx,
        signMessage: async (data) => data,
        signAllTransactions: async (txs) => txs,
    })
);
  umi.use(mplTokenMetadata());

  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // Prepare a new transaction
  const tx = new Transaction();
  tx.feePayer = userPubkey;
  console.log("Fee Payer: ", tx.feePayer.toBase58());

  // Fetch the latest blockhash
  const { blockhash } = await connection.getLatestBlockhash({ commitment: "finalized" });
  tx.recentBlockhash = blockhash;

  // Handle action types
  if (action === "send0.05" || action === "send1" || action === "send") {
    const lamports = action === "send0.05"
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
      console.log("Minting NFT using UMI...");
     
      const mint = generateSigner(umi);
      const sellerFeeBasisPoints = percentAmount(0, 2);

      const nftBuilder = createNft(umi, {
        mint,
        name: "SAF Supporter Badge",
        symbol: "SAF",
        uri: "https://devnet.irys.xyz/HAPEvLR5G53363X2Lu3XA8YsC661ejs8kC65VgVcAs1a",
        sellerFeeBasisPoints,
      });

      //working code, if set to createNoopSigner there will be no signer to perform the transaction
      // I need somehow to sign it with the wallet, so I need a transaction here
      // let result = await nftBuilder.sendAndConfirm(umi);
      // const signature = base58.encode(result.signature);

      //getting the instructions from the NFT
       const nftInstructions = nftBuilder.getInstructions();

       console.log("NFT Instructions: ", nftInstructions);

      // Convert the instructions to Web3.js format
      const web3jsNftInstructions = nftInstructions.map(toWeb3JsInstruction);
      console.log("Web3JS NFT Instructions: ", web3jsNftInstructions);

      // Convert the instructions back to UMI format
      // const nftInstructionsFromWeb3Js = web3jsNftInstructions.map(fromWeb3JsInstruction);
      // console.log("NFT Instructions from Web3JS: ", nftInstructionsFromWeb3Js);

      // Add the instructions to the transaction
      //here something is failing, is either the conversion or the transaction
      web3jsNftInstructions.forEach((instruction, index) => {
        console.log(`Instruction ${index + 1}: `, instruction);
        const txInstruction = new TransactionInstruction({
          keys: instruction.keys.map((key) => ({
            pubkey: new PublicKey(key.pubkey),
            isSigner: key.isSigner,
            isWritable: key.isWritable,
          })),
          programId: new PublicKey(instruction.programId),
          data: Buffer.from(instruction.data),
        });
        tx.add(txInstruction);
      });

      transactionCompleted = false;
      console.log("Transaction prepared for NFT minting.");
    } catch (error) {
      console.error("Minting error: ", error);
      return new Response(
        JSON.stringify({
          error: "Minting error",
          details: (error instanceof Error) ? error.message : "Unknown error",
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

      const responseBody: ActionPostResponse =await createPostResponse({
        fields:{
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
                links:{
                  actions: [
                    {
                      type: "transaction",
                      label: "Mint NFT",
                      href: url.origin + "/api/actions?action=mint",
                    },
                  ],
                }
              },
            },
          },
        }
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

  console.log("Serialized Transaction: ", serializedTx);

  // Return the serialized transaction for Blink to sign
  return Response.json({
    type: "transaction",
    transaction: serializedTx,
    message: "Transaction prepared and serialized successfully.",
  }, { headers: ACTIONS_CORS_HEADERS });
}


export const OPTIONS = async (req: Request) => {
  const headers = createActionHeaders();
  
  return new Response(null, { headers }); // CORS headers here
};