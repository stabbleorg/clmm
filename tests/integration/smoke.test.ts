import { describe, it, expect } from "vitest";
import { startBankrun, ADMIN_PUBKEY } from "../helpers/init-utils";
import { PROGRAM_ID } from "../helpers/constants";

describe("bankrun smoke test", () => {
  it("should boot bankrun with the program loaded", async () => {
    const context = await startBankrun();
    const client = context.banksClient;

    // Verify the program account exists and is executable
    const programAccount = await client.getAccount(PROGRAM_ID);
    expect(programAccount).not.toBeNull();
    expect(programAccount!.executable).toBe(true);
  });
});
