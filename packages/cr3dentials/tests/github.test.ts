import {
  generateEmailVerifierInputs,
  toNoirInputs,
  CircuitBackend,
} from "@zk-email/helpers/src/input-generators";
import fs from "fs";
import path from "path";
import {
  BarretenbergBackend,
  UltraHonkBackend,
} from "@noir-lang/backend_barretenberg";
import { Noir } from "@noir-lang/noir_js";
import circuit from "../target/noir_zkemail.json";

const emails = {
  ownership: fs.readFileSync(
    path.join(__dirname, "../emails/ownership.eml")
  ),
  // small: fs.readFileSync(
  //   path.join(__dirname, "../../circuits/tests/test-emails/test.eml")
  // ),
  // large: fs.readFileSync(
  //   path.join(__dirname, "../../helpers/tests/test-data/email-good-large.eml")
  // ),
};

describe("Fixed Size Circuit Input", () => {
  let noir: Noir;
  let ultraHonk: UltraHonkBackend;
  let barretenberg: BarretenbergBackend;
  jest.setTimeout(100000);
  beforeAll(async () => {
    ultraHonk = new UltraHonkBackend(circuit);
    barretenberg = new BarretenbergBackend(circuit);
    noir = new Noir(circuit);
  });

  describe("UltraHonk", () => {
    it("UltraHonk::OwnershipEmail", async () => {
      const inputs = await generateEmailVerifierInputs(emails.ownership, {
        backend: CircuitBackend.Noir,
      });
      const noirInputs = toNoirInputs(inputs, false);
      const { witness } = await noir.execute(noirInputs);
      console.log('Witness: ', witness);
      // const proof = await ultraHonk.generateProof(witness);
      // const result = await ultraHonk.verifyProof(proof);
      // expect(result).toBeTruthy();
    });
    // xit("UltraHonk::SmallEmail", async () => {
    //   const inputs = await generateEmailVerifierInputs(emails.small, {
    //     backend: CircuitBackend.Noir,
    //   });
    //   const noirInputs = toNoirInputs(inputs, false);
    //   const { witness } = await noir.execute(noirInputs);
    //   const proof = await ultraHonk.generateProof(witness);
    //   const result = await ultraHonk.verifyProof(proof);
    //   expect(result).toBeTruthy();
    // });

    // xit("UltraHonk::LargeEmail", async () => {
    //   const inputs = await generateEmailVerifierInputs(emails.large, {
    //     backend: CircuitBackend.Noir,
    //   });
    //   const noirInputs = toNoirInputs(inputs, false);
    //   const { witness } = await noir.execute(noirInputs);
    //   const proof = await ultraHonk.generateProof(witness);
    //   const result = await ultraHonk.verifyProof(proof);
    //   expect(result).toBeTruthy();
    // });
  });

  //   xdescribe("UltraPlonk", () => {
  //     it("UltraPlonk::SmallEmail", async () => {
  //       const inputs = await generateEmailVerifierInputs(emails.small, {
  //         backend: CircuitBackend.Noir,
  //       });
  //       const noirInputs = toNoirInputs(inputs, false);
  //       const { witness } = await noir.execute(noirInputs);
  //       const proof = await barretenberg.generateProof(witness);
  //       const result = await barretenberg.verifyProof(proof);
  //       expect(result).toBeTruthy();
  //     });

  //     it("UltraPlonk::LargeEmail", async () => {
  //       const inputs = await generateEmailVerifierInputs(emails.large, {
  //         backend: CircuitBackend.Noir,
  //       });
  //       const noirInputs = toNoirInputs(inputs, false);
  //       const { witness } = await noir.execute(noirInputs);
  //       const proof = await barretenberg.generateProof(witness);
  //       const result = await barretenberg.verifyProof(proof);
  //       expect(result).toBeTruthy();
  //     });
  //   });
});
