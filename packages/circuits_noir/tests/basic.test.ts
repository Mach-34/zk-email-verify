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
import smallEmailCircuit from "../v1/target/small_email.json";
import largeEmailCircuit from "../v1/target/large_email.json";

const emails = {
  small: fs.readFileSync(
    path.join(__dirname, "../../circuits/tests/test-emails/test.eml")
  ),
  large: fs.readFileSync(
    path.join(__dirname, "../../helpers/tests/test-data/email-good-large.eml")
  ),
};

describe("Fixed Size Circuit Input", () => {
  let noir: Noir;
  let ultraHonk: UltraHonkBackend;
  let barretenberg: BarretenbergBackend;
  jest.setTimeout(100000);

  describe("Small Email", () => {
    beforeAll(async () => {
      ultraHonk = new UltraHonkBackend(smallEmailCircuit);
      barretenberg = new BarretenbergBackend(smallEmailCircuit);
      noir = new Noir(smallEmailCircuit);
    });
    it("SmallEmail::UltraHonk", async () => {
      const inputs = await generateEmailVerifierInputs(emails.small, {
        backend: CircuitBackend.Noir,
      });
      const noirInputs = toNoirInputs(inputs);
      const { witness } = await noir.execute(noirInputs);
      const proof = await ultraHonk.generateProof(witness);
      const result = await ultraHonk.verifyProof(proof);
      expect(result).toBeTruthy();
    });

    it("SmallEmail::UltraPlonk", async () => {
      const inputs = await generateEmailVerifierInputs(emails.small, {
        backend: CircuitBackend.Noir,
      });
      const noirInputs = toNoirInputs(inputs);
      const { witness } = await noir.execute(noirInputs);
      const proof = await barretenberg.generateProof(witness);
      const result = await barretenberg.verifyProof(proof);
      expect(result).toBeTruthy();
    });
  });

  describe("Large Email", () => {
    beforeAll(async () => {
      ultraHonk = new UltraHonkBackend(largeEmailCircuit);
      barretenberg = new BarretenbergBackend(largeEmailCircuit);
      noir = new Noir(largeEmailCircuit);
    });
    it("LargeEmail::UltraHonk", async () => {
      const inputs = await generateEmailVerifierInputs(emails.large, {
        backend: CircuitBackend.Noir,
      });
        const noirInputs = toNoirInputs(inputs);
        const { witness } = await noir.execute(noirInputs);
        const proof = await ultraHonk.generateProof(witness);
        const result = await ultraHonk.verifyProof(proof);
        expect(result).toBeTruthy();
    });

    it("LargeEmail::UltraPlonk", async () => {
      const inputs = await generateEmailVerifierInputs(emails.large, {
        backend: CircuitBackend.Noir,
      });
        const noirInputs = toNoirInputs(inputs);
        const { witness } = await noir.execute(noirInputs);
        const proof = await barretenberg.generateProof(witness);
        const result = await barretenberg.verifyProof(proof);
        expect(result).toBeTruthy();
    });
  });
});
