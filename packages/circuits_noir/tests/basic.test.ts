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
import circuit from "../v1/target/noir_zkemail.json";

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

  it("Should Prove with UltraHonk", async () => {
    const rawEmail = fs.readFileSync(
      path.join(__dirname, "../../circuits/tests/test-emails/test.eml")
    );
    const inputs = await generateEmailVerifierInputs(rawEmail, {
      backend: CircuitBackend.Noir,
    });
    const noirInputs = toNoirInputs(inputs);
    const { witness } = await noir.execute(noirInputs);
    const proof = await ultraHonk.generateProof(witness);
    expect(await ultraHonk.verifyProof(proof));
  });

  it("Should Prove with UltraPlonk", async () => {
    const rawEmail = fs.readFileSync(
      path.join(__dirname, "../../circuits/tests/test-emails/test.eml")
    );
    const inputs = await generateEmailVerifierInputs(rawEmail, {
      backend: CircuitBackend.Noir,
    });
    const noirInputs = toNoirInputs(inputs);
    const { witness } = await noir.execute(noirInputs);
    const proof = await barretenberg.generateProof(witness);
    expect(await barretenberg.verifyProof(proof));
  });
});
