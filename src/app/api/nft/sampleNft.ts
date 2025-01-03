import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import * as fs from "fs";
import {
  createSignerFromKeypair,
  signerIdentity,
  generateSigner,
  percentAmount,
} from "@metaplex-foundation/umi";
import {
  createNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { PublicKey, Transaction } from "@solana/web3.js";
import wallet from "/home/daniel/.solana/.config/keypari.json";
import base58 from "bs58";

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
): Promise<{ signature: string; mintAddress: string }> {
  try {
    let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
    const myKeypairSigner = createSignerFromKeypair(umi, keypair);
    umi.use(signerIdentity(myKeypairSigner));
    umi.use(mplTokenMetadata());

    const mint = generateSigner(umi);
    const sellerFeeBasisPoints = percentAmount(fee, 2);

    let tx = createNft(umi, {
      mint,
      name,
      symbol,
      uri,
      sellerFeeBasisPoints,
    });
    let result = await tx.sendAndConfirm(umi);
    const signature = base58.encode(result.signature);

    console.log(
      `Succesfully Minted! Check out your TX here:\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`
    );
    // https://explorer.solana.com/address/${mint.publicKey}
    console.log(
      "Mint Address: ",
      `https://explorer.solana.com/address/${mint.publicKey}?cluster=devnet`
    );

    return {
      signature,
      mintAddress: mint.publicKey,
    };
  } catch (error) {
    console.error("Error minting NFT:", error);
    throw error;
  }
}
