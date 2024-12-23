import { ActionGetResponse, ActionPostRequest, ActionPostResponse, ACTIONS_CORS_HEADERS } from "@solana/actions";
import { clusterApiUrl, Connection, PublicKey, SystemProgram, Transaction} from "@solana/web3.js"

export async function GET(request: Request) {
  const responseBody : ActionGetResponse = {
    icon: "https://bafybeibqfafl757oc2ts3dnyxpapq7fthx2og2kod4cd3yeysm7q6hxaxq.ipfs.flk-ipfs.xyz",
    description: "The time to act is now ! ... before their silence becomes our legacy.",
    title: "Solana Ark Foundation Supporter",
    label: "Make a donation", 
    error: {
      message:"This is my error",
    },
  }

  return Response.json(responseBody, {headers:ACTIONS_CORS_HEADERS});
}

export async function POST(request: Request) {

     const requestBody: ActionPostRequest = await request.json();
     const userPubkey = requestBody.account;
    
    const user = new PublicKey(userPubkey);
     
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    const ix = SystemProgram.transfer({
      fromPubkey: user,
      toPubkey: new PublicKey("BN8LeCtMenajmBbzRKqkPFcP2hAJjrtCFfd4XmUqxJ9G"),
      lamports: 50000000,
    });

     const tx = new Transaction();
     tx.add(ix);
     tx.feePayer = user;
      
    // tx.recentBlockhash = SystemProgram.programId.toBase58();   
     const bh =  (await connection.getLatestBlockhash({commitment: "finalized"})).blockhash
     tx.recentBlockhash = bh;
     const serialTx = tx.serialize({requireAllSignatures: false, verifySignatures:false}).toString("base64");

     const responseBody : ActionPostResponse = {
      type: "transaction",
      transaction:serialTx,
      message: " Hello: "+ userPubkey,
     }
     return Response.json(responseBody,{headers:ACTIONS_CORS_HEADERS});
}

export async function OPTIONS(request: Request) {

  return new Response(null, { headers: ACTIONS_CORS_HEADERS });
}

