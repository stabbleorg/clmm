import { Rpc, Address } from "@solana/kit";
import { SolanaRpcType } from "../types";
import { fetchToken, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";
import {
  fetchToken as fetchToken22,
  TOKEN_2022_PROGRAM_ADDRESS,
} from "@solana-program/token-2022";

export async function getToken(rpc: Rpc<SolanaRpcType>, tokenAccount: Address) {
  const tokenAccountInfo = await rpc
    .getAccountInfo(tokenAccount, { encoding: "base64" })
    .send();

  if (tokenAccountInfo.value?.owner === TOKEN_PROGRAM_ADDRESS) {
    return fetchToken(rpc, tokenAccount);
  } else if (tokenAccountInfo.value?.owner === TOKEN_2022_PROGRAM_ADDRESS) {
    return fetchToken22(rpc, tokenAccount);
  } else {
    throw new Error("Invalid Token Account!");
  }
}
