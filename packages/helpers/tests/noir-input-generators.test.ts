import fs from "fs";
import path from "path";
import { generateEmailVerifierInputs, CircuitBackend, toNoirInputs } from "../src/input-generators";
import { bytesToString } from "../src/binary-format";

jest.setTimeout(10000);

describe("Input generators", () => {
  it("Input generation test", async () => {
    // const email = fs.readFileSync(
    //   path.join(__dirname, "test-data/email-good-large.eml")
    // );
    const email = fs.readFileSync(
      path.join(__dirname, "test-data/merge.eml")
    );

    const inputs = await generateEmailVerifierInputs(email, {
      backend: CircuitBackend.Noir,
      maxHeadersLength: 1536,
      maxBodyLength: 1536
    });

    // expect(inputs.emailHeader).toBeDefined();
    // expect(inputs.pubkey).toBeDefined();
    // expect(inputs.signature).toBeDefined();
    // expect(inputs.precomputedSHA).toBeDefined();
    // expect(inputs.emailBody).toBeDefined();
    // expect(inputs.emailBodyLength).toBeDefined();
    // expect(inputs.bodyHashIndex).toBeDefined();
    const formattedInputs = toNoirInputs(inputs);
    
    console.log("header length", formattedInputs.header.length);
    console.log("Body length: ", formattedInputs.body.length);
    // console.log(formattedInputs.body?.slice(0, Number(formattedInputs.body_length)));
    // console.log("header length: ", formattedInputs.header_length);
  });
});
