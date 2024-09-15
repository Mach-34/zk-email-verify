import fs from "fs";
import path from "path";
import { generateEmailVerifierInputs, CircuitBackend, toNoirInputs } from "../src/input-generators";
import { bytesToString } from "../src/binary-format";
import * as NoirRedc from "noir_redc";

jest.setTimeout(10000);

describe("Input generators", () => {
  it("Init Noir Redc Wasm", async () => {
    let x = NoirRedc.test_str("XXX");
    console.log(x);
  });
  it("Input generation test", async () => {
    const email = fs.readFileSync(
      path.join(__dirname, "test-data/email-good.eml")
    );

    const inputs = await generateEmailVerifierInputs(email, {
      backend: CircuitBackend.Noir,
    });

    // expect(inputs.emailHeader).toBeDefined();
    // expect(inputs.pubkey).toBeDefined();
    // expect(inputs.signature).toBeDefined();
    // expect(inputs.precomputedSHA).toBeDefined();
    // expect(inputs.emailBody).toBeDefined();
    // expect(inputs.emailBodyLength).toBeDefined();
    // expect(inputs.bodyHashIndex).toBeDefined();

    const formattedInputs = toNoirInputs(inputs);
    console.log("formattedInputs", JSON.stringify(formattedInputs.signature));
    // console.log(formattedInputs.body?.slice(0, Number(formattedInputs.body_length)));
    // console.log("header length: ", formattedInputs.header_length);
  });
});
