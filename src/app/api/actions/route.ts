import {
  Action,
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  CompletedAction,
  createActionHeaders,
  createPostResponse,
} from "@solana/actions";
import {
  Account,
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { ACTIONS_CORS_HEADERS } from "./const";
// import { mintNFTForUser } from "../nft/nft_mint_wallet";
import { mintNFTForUser } from "../nft/nft_mint";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createNoopSigner , publicKey } from "@metaplex-foundation/umi"
import { createNft, Key, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { generateSigner, percentAmount, signerIdentity } from "@metaplex-foundation/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

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
  const signer = createNoopSigner(publicKey(userPubkey.toBase58()));
  umi.use(signerIdentity(signer));
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
      console.log("Transaction: ", tx);
     
      const mint = generateSigner(umi);
      const sellerFeeBasisPoints = percentAmount(0, 2);

      const nftBuilder = createNft(umi, {
        mint,
        name: "SAF Supporter Badge",
        symbol: "SAF",
        uri: "https://devnet.irys.xyz/HAPEvLR5G53363X2Lu3XA8YsC661ejs8kC65VgVcAs1a",
        sellerFeeBasisPoints,
      });

      const nftInstructions = nftBuilder.getInstructions();
      console.log("TX Instructions: ", tx.instructions);
      console.log("NFT Instructions: ", nftInstructions);

      nftInstructions.forEach((instruction, index) => {
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

    //  Validate Mint Account Initialization
    const createMintAccountInstruction = SystemProgram.createAccount({
      fromPubkey: userPubkey,
      newAccountPubkey: new PublicKey(mint.publicKey),
      space: 82, // Size of a token mint account
      lamports: await connection.getMinimumBalanceForRentExemption(82),
      programId: TOKEN_PROGRAM_ID,
    });
    
    tx.add(createMintAccountInstruction);

      transactionCompleted = false;
      console.log("TX Instructions",tx.instructions);
      console.log("Transaction: ", tx);
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