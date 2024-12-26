import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import * as fs from 'fs';
import { createSignerFromKeypair, signerIdentity, generateSigner, percentAmount } from "@metaplex-foundation/umi";
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { PublicKey, Transaction, TransactionInstruction, Connection, clusterApiUrl } from "@solana/web3.js";
// import wallet from "/home/daniel/.solana/.config/keypari.json";
import base58 from "bs58";
import { ActionPostResponse } from "@solana/actions-spec";
import { ACTIONS_CORS_HEADERS } from "../actions/const";

const RPC_ENDPOINT = "https://api.devnet.solana.com";
const umi = createUmi(RPC_ENDPOINT);

/**
 * Mint an NFT for a specific user, using a signer for authorization.
 * @param {PublicKey} user - The public key of the user for whom the NFT is being minted.
 * @param {string} name - The name of the NFT.
 * @param {string} uri - The metadata URI of the NFT.
 * @param {string} symbol - The symbol of the NFT.
 * @param {number} fee - The seller fee basis points (as a percentage, e.g., 2 for 2%).
 * @returns {Promise<{signature: string, mintAddress: string}>} - The transaction signature and mint address.
 */
export async function mintNFTForUser(
    user: PublicKey,
    name: string,
    uri: string,
    symbol: string,
    fee: number = 0
): Promise<{ signature: string; mintAddress: string; }> {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    try {
        // const walletPath = "/home/daniel/.solana/.config/keypari.json";
        // const walletData = fs.readFileSync(walletPath, "utf-8");
        // const secretKeyArray = JSON.parse(walletData);

        // if (!Array.isArray(secretKeyArray) || secretKeyArray.length !== 64) {
        //     throw new Error("Invalid keypair file. Ensure it contains a valid 64-byte secret key.");
        // }

        // const secretKey = new Uint8Array(secretKeyArray);
        // const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
        // const signer = createSignerFromKeypair(umi, keypair);

        umi.use(mplTokenMetadata());
        const sellerFeeBasisPoints = percentAmount(fee, 2);

       // umi.use(signerIdentity(signer));
        umi.use(mplTokenMetadata());

        const mint = generateSigner(umi);
       

        const adjustedUri = uri.replace("arweave.net", "devnet.irys.xyz");

         const nftInstruction = createNft(umi, {
            mint,
            name,
            symbol,
            uri: adjustedUri,
            sellerFeeBasisPoints,
            updateAuthority: mint, // Use mint as the initial update authority
        });

       // Convert TransactionBuilder into a Web3.js Transaction
       const tx = new Transaction();
       const instructions = nftInstruction.getInstructions().map(instruction => {
           return new TransactionInstruction({
               keys: instruction.keys.map(key => ({
                   pubkey: new PublicKey(key.pubkey),
                   isSigner: key.isSigner,
                   isWritable: key.isWritable,
               })),
               programId: new PublicKey(instruction.programId),
               data: Buffer.from(instruction.data),
           });
       });
       tx.add(...instructions);

        // Set fee payer and blockhash
        tx.feePayer = user;
        const bh = (await connection.getLatestBlockhash({ commitment: "finalized" }))
        .blockhash;
        tx.recentBlockhash = bh;
        const serialTx = tx.serialize({ requireAllSignatures: false, verifySignatures: false })
    .toString("base64");
        // Return a mock result for now
        return { signature: serialTx, mintAddress: mint.publicKey };
    } catch (error) {
        console.error("Error minting NFT:", error);
        throw error;
    }
}