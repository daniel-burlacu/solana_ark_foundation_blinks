import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createSignerFromKeypair, signerIdentity, generateSigner, percentAmount } from "@metaplex-foundation/umi";
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { PublicKey } from "@solana/web3.js";
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
export async function mintNFTForUser(user: PublicKey, name: string, uri: string, symbol: string, fee: number = 0): Promise<{ signature: string; mintAddress: string; }> {
    try {
        // Load the keypair for the signer
        const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
        const signer = createSignerFromKeypair(umi, keypair);

        // Set the signer identity
        umi.use(signerIdentity(signer));
        umi.use(mplTokenMetadata());

        // Generate the mint keypair for the NFT
        const mint = generateSigner(umi);
        const sellerFeeBasisPoints = percentAmount(fee, 2);

        // Adjust URI for devnet testing
        const adjustedUri = uri.replace("arweave.net", "devnet.irys.xyz");

        // Create the NFT
        const tx = createNft(umi, {
            mint,
            name,
            symbol,
            uri: adjustedUri,
            sellerFeeBasisPoints,
        });

        // Send and confirm the transaction
        const result = await tx.sendAndConfirm(umi);

        // Get the transaction signature and mint address
        const signature = base58.encode(result.signature);
        console.log(`Successfully Minted! Check out your TX here:\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`);
        console.log("Mint Address: ", mint.publicKey);

        return {
            signature,
            mintAddress: mint.publicKey,
        };
    } catch (error) {
        console.error("Error minting NFT:", error);
        throw error;
    }
}

// import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
// import { createSignerFromKeypair, signerIdentity, generateSigner, percentAmount } from "@metaplex-foundation/umi"
// import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";

// import wallet from "/home/daniel/.solana/.config/keypari.json";
// import base58 from "bs58";

// const RPC_ENDPOINT = "https://api.devnet.solana.com";
// const umi = createUmi(RPC_ENDPOINT);

// let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));

// const myKeypairSigner = createSignerFromKeypair(umi, keypair);
// umi.use(signerIdentity(myKeypairSigner));
// umi.use(mplTokenMetadata())

// const mint = generateSigner(umi);
// const sellerFeeBasisPoints = percentAmount(0, 2);

// const name = "Solana Ark Foundation Supporter Badge";
// let uri = "https://arweave.net/29gGS3ZEDqv9PBwrm5KFUfwuhZrRGKXoSx7N9xuq6vWA";


// uri = uri.replace("arweave.net", "devnet.irys.xyz"); 

// const symbol = "SAF";
// // const description = "Dogpound Charity NFT - A Sol for a Bone !";
// // const image = "https://arweave.net/zpBs5PJR2eVwT2hGoMZg9aFbBu2MEYuKRwGnHkX3eAb";
// (async () => {
//     let tx = createNft(
//         umi, 
//         {
//           mint,
//           name,
//           symbol,
//           uri,
//           sellerFeeBasisPoints,
//         },
//     )
//     let result = await tx.sendAndConfirm(umi);
//     const signature = base58.encode(result.signature);
    
//     console.log(`Succesfully Minted! Check out your TX here:\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`)

//     console.log("Mint Address: ", mint.publicKey);
// })();