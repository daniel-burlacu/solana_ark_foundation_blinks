// import wallet from "/home/daniel/.solana/.config/keypari.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { readFile } from "fs/promises";

// Create a devnet connection
const umi = createUmi('https://api.devnet.solana.com');

// let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
// const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
// umi.use(signerIdentity(signer));

(async () => {
    try {
        //1. Load image
        //2. Convert image to generic file.
        //3. Upload image

        const image = await readFile("/home/daniel/turbin3/capstone/Q4_SOL_DanielB/ts/cluster1/image/SolanaSupporter.png");
        const genericFile = createGenericFile(image, 'NFT-Dogpound-Charity',{contentType: 'image/png'});
        const [myUri] = await umi.uploader.upload([genericFile]); 
        
        console.log("Your metadata URI: ", myUri.replace("arweave.net", "devnet.irys.xyz"));
    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
    }
})();
