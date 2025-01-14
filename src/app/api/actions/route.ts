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

const serializedTx = tx
.serialize({
  requireAllSignatures: false, // Let Blink handle the signing
  verifySignatures: false,
})
.toString("base64");

console.log("Serialized Transaction: ", serializedTx);

return Response.json(responseBody, { headers: ACTIONS_CORS_HEADERS });
    
  } 
}