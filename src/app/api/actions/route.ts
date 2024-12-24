import { ActionGetResponse, ActionPostRequest, ActionPostResponse, ACTIONS_CORS_HEADERS } from "@solana/actions";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction} from "@solana/web3.js"
import { DEFAULT_SOL_ADDRESS, DEFAULT_SOL_AMOUNT } from "./const";

export async function GET(request: Request) {
  
  const requestUrl = new URL(request.url);
  // const { toPubkey } = validatedQueryParams(requestUrl);
  
  // const baseHref = new URL(
  //   `/api/actions/?to=${toPubkey.toBase58()}`,
  //   requestUrl.origin,
  // ).toString();

  const responseBody : ActionGetResponse = {
    icon: "https://bafybeibqfafl757oc2ts3dnyxpapq7fthx2og2kod4cd3yeysm7q6hxaxq.ipfs.flk-ipfs.xyz",
    description: "The time to act is now ! ... before their silence becomes our legacy.",
    title: "Solana Ark Foundation Supporter",
    label: "Make a donation", 
    links:{
      actions:[
        {
          href: request.url+"?action=send0.05",
          label: "Send 0.05 Sol",
          type: "transaction"
        },
        {
          href: request.url+"?action=send1",
          label: "Send 1 Sol",
          type: "transaction"
        },
        {
          href: request.url+"?action=send&amount={amount}",
          label: "Send Sol",
          type: "transaction",
          parameters: [
            {
              name: "amount",
              label: "Enter the amount of SOL to send",
              required: true
            }
          ]
        }
      ]
    }

  }

  return Response.json(responseBody, {headers:ACTIONS_CORS_HEADERS});
}

export async function POST(request: Request) {

    const requestBody: ActionPostRequest = await request.json();
    const userPubkey = requestBody.account;
    
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    const param = url.searchParams.get("amount");

    const amountInSOL = parseFloat(param||"0");

    // if (isNaN(amountInSOL) || amountInSOL <= 0) {
    //   throw new Error("Invalid amount entered");
    // }

    const lamports = Math.round(amountInSOL * LAMPORTS_PER_SOL);
    const user = new PublicKey(userPubkey);
     
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    const ix005 = SystemProgram.transfer({
      fromPubkey: user,
      toPubkey: new PublicKey("BN8LeCtMenajmBbzRKqkPFcP2hAJjrtCFfd4XmUqxJ9G"),
      lamports: 50000000,
    });

    const ix1 = SystemProgram.transfer({
      fromPubkey: user,
      toPubkey: new PublicKey("BN8LeCtMenajmBbzRKqkPFcP2hAJjrtCFfd4XmUqxJ9G"),
      lamports: 1000000000,
    });

    const ixParam = SystemProgram.transfer({
      fromPubkey: user,
      toPubkey: new PublicKey("BN8LeCtMenajmBbzRKqkPFcP2hAJjrtCFfd4XmUqxJ9G"),
      lamports
    });

     const tx = new Transaction();
    if( action == "send0.05"){
      tx.add(ix005);
    }else if( action == "send1"){
      tx.add(ix1);
    }
    else if( action == "send"){
      tx.add(ixParam);
    }else {
      return Response.json("400",{headers:ACTIONS_CORS_HEADERS});
    }
    tx.feePayer = user;
    const bh =  (await connection.getLatestBlockhash({commitment: "finalized"})).blockhash
    tx.recentBlockhash = SystemProgram.programId.toBase58();   
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

// function validatedQueryParams(requestUrl: URL) {
//   let toPubkey: PublicKey = DEFAULT_SOL_ADDRESS;
//   let amount: number = DEFAULT_SOL_AMOUNT;

//   try {
//     if (requestUrl.searchParams.get("to")) {
//       toPubkey = new PublicKey(requestUrl.searchParams.get("to")!);
//     }
//   } catch (err) {
//     throw "Invalid input query parameter: to";
//   }

//   try {
//     if (requestUrl.searchParams.get("amount")) {
//       amount = parseFloat(requestUrl.searchParams.get("amount")!);
//     }

//     if (amount <= 0) throw "amount is too small";
//   } catch (err) {
//     throw "Invalid input query parameter: amount";
//   }

//   return {
//     amount,
//     toPubkey,
//   };
// }