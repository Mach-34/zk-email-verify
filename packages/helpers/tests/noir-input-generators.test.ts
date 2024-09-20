import fs from "fs";
import path from "path";
import { generateEmailVerifierInputs, CircuitBackend, toNoirInputs, toProverToml } from "../src/input-generators";
import { bytesToString } from "../src/binary-format";

jest.setTimeout(10000);

describe("Input generators", () => {
  it("Input generation test", async () => {
    // const email = fs.readFileSync(
    //   path.join(__dirname, "test-data/email-good-large.eml")
    // );
    const email = fs.readFileSync(
      path.join(__dirname, "test-data/ownership.eml")
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
    console.log("Inputs: ", inputs);
    const formattedInputs = toNoirInputs(inputs);
    const tomlInputs = toProverToml(inputs);
    console.log("Prover.toml");
    console.log(tomlInputs);
    // console.log("bh index", formattedInputs.body_hash_index);
    // console.log("formattedInputs", formattedInputs.header.length);
    // console.log("Body length: ", formattedInputs.body.length);
    // console.log(formattedInputs.body?.slice(0, Number(formattedInputs.body_length)));
    // console.log("header length: ", formattedInputs.header_length);
  });
});
