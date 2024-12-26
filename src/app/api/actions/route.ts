import { Action, ActionGetResponse, ActionPostRequest, ActionPostResponse,  CompletedAction, createActionHeaders } from "@solana/actions";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction} from "@solana/web3.js"
import { ACTIONS_CORS_HEADERS} from "./const";
import { mintNFTForUser } from "../nft/nft_mint";


let transactionCompleted = false; // Global boolean state
const headers = createActionHeaders();
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const responseBody: ActionGetResponse = transactionCompleted
      ? {
            icon: "https://bafybeibqfafl757oc2ts3dnyxpapq7fthx2og2kod4cd3yeysm7q6hxaxq.ipfs.flk-ipfs.xyz",
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
            icon: "https://bafybeibqfafl757oc2ts3dnyxpapq7fthx2og2kod4cd3yeysm7q6hxaxq.ipfs.flk-ipfs.xyz",
            description: "The time to act is now! ... before their silence becomes our legacy.",
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
                        href: requestUrl.origin + "/api/actions?action=send&amount={amount}",
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
  const userPubkey = requestBody.account;

  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const param = url.searchParams.get("amount");

  const amountInSOL = parseFloat(param || "0");

  if (isNaN(amountInSOL) || amountInSOL <= 0) {
    return new Response("Invalid amount", {
        status: 400,
        headers: ACTIONS_CORS_HEADERS ,
    });
}

  const lamports = Math.round(amountInSOL * LAMPORTS_PER_SOL);
  const user = new PublicKey(userPubkey);

  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

 let ixParam = undefined;
    
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
  
  if (action === "send" && param) {
     ixParam = SystemProgram.transfer({
      fromPubkey: user,
      toPubkey: new PublicKey("BN8LeCtMenajmBbzRKqkPFcP2hAJjrtCFfd4XmUqxJ9G"),
      lamports,
    });
  } 

  const tx = new Transaction();
  if (action === "send0.05") {
      tx.add(ix005);
  } else if (action === "send1") {
      tx.add(ix1);
  } else if (action === "send") {
    ixParam !== undefined && tx.add(ixParam);
  }
  else if (action === "mint") {
      mintNFTForUser(user, "SAF Supporter Badge", "https://devnet.irys.xyz/HAPEvLR5G53363X2Lu3XA8YsC661ejs8kC65VgVcAs1a", "SAF", 0); 
      transactionCompleted = false;
    }
   else {
      return Response.json("400", { headers: ACTIONS_CORS_HEADERS });
  }

  tx.feePayer = user;
  const bh = (await connection.getLatestBlockhash({ commitment: "finalized" })).blockhash;
  tx.recentBlockhash = bh;
  const serialTx = tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64");


  try {
      // Simulate transaction processing
      if (action.startsWith("send")) {
          transactionCompleted = true; // Update the global state

          // Define the mint action
          
          const mintAction: Action | CompletedAction = {
            type: "action",
            label: "Mint NFT",
            title: "Mint SAF NFT",
            description: "Mint your Solana Ark Foundation Supporter Badge.",
            links: {
              actions: [
                {
                  type: "transaction",
                  label: "Mint NFT",
                  parameters: [],
                  href: ""
                },
              ],
            },
            icon: ""
          };

          const responseBody: ActionPostResponse = {
              type: "transaction",
              transaction: serialTx,
              message: "Donation successful! Proceed to mint your NFT.",
              links: {
                  next: {
                      type: "inline",
                      action: mintAction,
                  },
              },
          };

          return Response.json(responseBody, { headers: ACTIONS_CORS_HEADERS });
      }
  } catch (error) {
      return Response.json({ error: "Transaction error", details: (error as any).message }, { headers: ACTIONS_CORS_HEADERS });
  }

  const responseBody: ActionPostResponse = {
      type: "transaction",
      transaction: serialTx,
      message: "Transaction completed.",
  };

  return Response.json(responseBody, { headers: ACTIONS_CORS_HEADERS });
}

export const OPTIONS = async () => Response.json(null, { headers: ACTIONS_CORS_HEADERS });

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