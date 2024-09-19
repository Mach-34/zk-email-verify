import {
  generateEmailVerifierInputs,
  generateEmailVerifierInputsFromDKIMResult,
  toNoirInputs,
  CircuitBackend,
} from "@zk-email/helpers/src/input-generators";
import { verifyDKIMSignature } from "@zk-email/helpers/src/dkim";
import fs from "fs";
import path from "path";
import {
  BarretenbergBackend,
  UltraHonkBackend,
} from "@noir-lang/backend_barretenberg";
import { Noir } from "@noir-lang/noir_js";
import circuit1024 from "../email-verifier-1024/target/noir_zkemail_1024.json";
import circuit2048 from "../email-verifier-2048/target/noir_zkemail_2048.json";
import circuitGitub from "../github-ownership/target/github_ownership.json";

const emails = {
  small: fs.readFileSync(
    path.join(__dirname, "../../circuits/tests/test-emails/test.eml")
  ),
  large: fs.readFileSync(
    path.join(__dirname, "../../helpers/tests/test-data/email-good-large.eml")
  ),
  ownership: fs.readFileSync(
    path.join(__dirname, "../../helpers/tests/test-data/ownership.eml")
  ),
  pr: fs.readFileSync(
    path.join(__dirname, "../pr_merge.eml")
  )
};

type Prover = {
  noir: Noir,
  barretenberg: BarretenbergBackend,
  ultraHonk: UltraHonkBackend,
};

describe("Fixed Size Circuit Input", () => {
  let prover1024: Prover;
  let prover2048: Prover;
  let proverGithub: Prover;
  jest.setTimeout(100000);
  beforeAll(async () => {
    prover1024 = {
      noir: new Noir(circuit1024),
      barretenberg: new BarretenbergBackend(circuit1024),
      ultraHonk: new UltraHonkBackend(circuit1024)

    };
    prover2048 = {
      noir: new Noir(circuit2048),
      barretenberg: new BarretenbergBackend(circuit2048),
      ultraHonk: new UltraHonkBackend(circuit2048)
    };
    
    proverGithub = {
      noir: new Noir(circuitGitub),
      barretenberg: new BarretenbergBackend(circuitGitub),
      ultraHonk: new UltraHonkBackend(circuitGitub)
    };
  });

  describe("UltraHonk", () => {
    xit("UltraHonk::SmallEmail", async () => {
      const inputs = await generateEmailVerifierInputs(emails.small, {
        backend: CircuitBackend.Noir,
      });
      const noirInputs = toNoirInputs(inputs, false);
      const { witness } = await prover2048.noir.execute(noirInputs);
      const proof = await prover2048.ultraHonk.generateProof(witness);
      const result = await prover2048.ultraHonk.verifyProof(proof);
      expect(result).toBeTruthy();
    });

    xit("UltraHonk::LargeEmail", async () => {
      const inputs = await generateEmailVerifierInputs(emails.large, {
        backend: CircuitBackend.Noir,
      });
      const noirInputs = toNoirInputs(inputs, false);
      const { witness } = await prover2048.noir.execute(noirInputs);
      const proof = await prover2048.ultraHonk.generateProof(witness);
      const result = await prover2048.ultraHonk.verifyProof(proof);
      expect(result).toBeTruthy();
    });
    xit("UltraHonk::Ownership", async () => {
      const inputs = await generateEmailVerifierInputs(emails.ownership, {
        backend: CircuitBackend.Noir,
      });
      const noirInputs = toNoirInputs(inputs, false);
      const { witness } = await prover1024.noir.execute(noirInputs);
      const proof = await prover1024.ultraHonk.generateProof(witness);
      const result = await prover1024.ultraHonk.verifyProof(proof);
      expect(result).toBeTruthy();
    });
    it("UltraHonk::PR", async () => {
      const inputs = await generateEmailVerifierInputs(emails.pr, {
        backend: CircuitBackend.Noir,
        maxBodyLength: 2816,
        maxHeadersLength: 1408,
        removeSoftLineBreaks: true
      });
      const noirInputs = toNoirInputs(inputs, false);
      console.log("header length: ", noirInputs.header.length);
      console.log("asserted header length: ", inputs.emailHeaderLength);
      console.log("body length: ", noirInputs.body.length);
      console.log("asserted body length: ", inputs.emailBodyLength);

      const { witness } = await proverGithub.noir.execute(noirInputs);
      const proof = await proverGithub.ultraHonk.generateProof(witness);
      const result = await proverGithub.ultraHonk.verifyProof(proof);
      expect(result).toBeTruthy();
    });
  });

  xdescribe("UltraPlonk", () => {
    it("UltraPlonk::SmallEmail", async () => {
      const inputs = await generateEmailVerifierInputs(emails.small, {
        backend: CircuitBackend.Noir,
      });
      const noirInputs = toNoirInputs(inputs, false);
      const { witness } = await prover2048.noir.execute(noirInputs);
      const proof = await prover2048.barretenberg.generateProof(witness);
      const result = await prover2048.barretenberg.verifyProof(proof);
      expect(result).toBeTruthy();
    });

    it("UltraPlonk::LargeEmail", async () => {
      const inputs = await generateEmailVerifierInputs(emails.large, {
        backend: CircuitBackend.Noir,
      });
      const noirInputs = toNoirInputs(inputs, false);
      const { witness } = await prover2048.noir.execute(noirInputs);
      const proof = await prover2048.barretenberg.generateProof(witness);
      const result = await prover2048.barretenberg.verifyProof(proof);
      expect(result).toBeTruthy();
    });
  });
});
