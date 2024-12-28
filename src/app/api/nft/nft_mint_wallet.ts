// import { Connection, PublicKey, Transaction } from "@solana/web3.js";
// import { Metaplex, keypairIdentity, toMetaplexFile, toBigNumber, walletAdapterIdentity } from "@metaplex-foundation/js";
// import { TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
// import { useWallet } from '@solana/wallet-adapter-react'; 
// import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

// const RPC_ENDPOINT = "https://api.devnet.solana.com";
// const umi = createUmi(RPC_ENDPOINT);
// const tx = new Transaction();
// /**
//  * Mint an NFT for a specific user, using a signer for authorization.
//  * @param {PublicKey} user - The public key of the user for whom the NFT is being minted.
//  * @param {string} name - The name of the NFT.
//  * @param {string} uri - The metadata URI of the NFT.
//  * @param {string} symbol - The symbol of the NFT.
//  * @param {number} fee - The seller fee basis points (as a percentage, e.g., 2 for 2%).
//  * @returns {Promise<{signature: string, mintAddress: string}>} - The transaction signature and mint address.
//  */
// export async function mintNFTForUser(
//   user: PublicKey,
//   name: string,
//   uri: string,
//   symbol: string,
//   fee: number = 0
// ): Promise<{ signature: string; mintAddress: string; }> {
//   const wallet = useWallet();
//   const connection = new Connection(RPC_ENDPOINT);

//   if (!wallet.connected || !wallet.publicKey) {
//     throw new Error("No wallet connected or no public key available."); 
//   }

//   const metaplex = new Metaplex(connection).use(walletAdapterIdentity(wallet)); 

//   const { nft, response } = await metaplex.nfts().create({
//     uri,
//     name,
//     symbol,
//     sellerFeeBasisPoints: fee,
//     creators: [{
//       address: wallet.publicKey,
//       share: 10,
//     }],
//     updateAuthority: metaplex.identity(), // Use metaplex.identity()
//     tokenStandard: TokenStandard.NonFungible,
//   });

//   const { signature } = response;
//   const mintAddress = nft.address.toBase58();

//   console.log(`Successfully Minted! Check out your TX here:\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`);
//   console.log("Mint Address: ", mintAddress);


//   return { signature: response.signature, mintAddress: nft.address.toBase58() };
// }