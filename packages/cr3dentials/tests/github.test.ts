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
import ownerCircuit from "../circuits/ownership/target/github_ownership.json";
import prMergeCircuit from "../circuits/pr_merge/target/github_pr_merge.json";

const emails = {
  ownership: fs.readFileSync(
    path.join(__dirname, "../emails/ownership.eml")
  ),
  pr_merge: fs.readFileSync(
    path.join(__dirname, "../emails/pr_merge.eml")
  ),
};

describe("Fixed Size Circuit Input", () => {
  let noir: Noir;
  let ultraHonk: UltraHonkBackend;
  let barretenberg: BarretenbergBackend;
  jest.setTimeout(100000);
  describe("UltraHonk", () => {
    xit("UltraHonk::OwnershipEmail", async () => {
      ultraHonk = new UltraHonkBackend(ownerCircuit);
      barretenberg = new BarretenbergBackend(ownerCircuit);
      noir = new Noir(ownerCircuit);

      const from = "noreply@github.com";
      const to = 'ianbrighton1@gmail.com';
      const username = "Ian-Bright"
      const fromBuffer = Buffer.from(from);
      const toBuffer = Buffer.from(to);
      const usernameBuffer = Buffer.from(username);

      const inputs = await generateEmailVerifierInputs(emails.ownership, {
        backend: CircuitBackend.Noir,
        maxBodyLength: 896
      });
      const defaultNoirInputs = toNoirInputs(inputs, false);

      const emailHeaderBytes = Buffer.from(inputs.emailHeader.map(val => Number(val)));
      const emailBodyBytes = Buffer.from(inputs.emailBody!.map(val => Number(val)));

      const noirInputs = {
        ...defaultNoirInputs,
        from_index: emailHeaderBytes.indexOf(fromBuffer),
        to_index: emailHeaderBytes.indexOf(toBuffer),
        to_len: toBuffer.length,
        username_index: emailBodyBytes.indexOf(usernameBuffer),
        username_len: usernameBuffer.length
      };

      const { witness } = await noir.execute(noirInputs);
      const proof = await ultraHonk.generateProof(witness);
      const result = await ultraHonk.verifyProof(proof);
      expect(result).toBeTruthy();

      // console.log('Proof: ', proof);

      // const buffer = new Uint8Array(320);
      // const toBytes = new Uint8Array(toBuffer)
      // buffer.set(toBytes, 0);
      // const hash = pedersenHash(Array.from(buffer));
      // console.log('Hash: ', hash);

    });

    it("Ultrahonk::PrMergeEmail", async () => {
      ultraHonk = new UltraHonkBackend(prMergeCircuit);
      barretenberg = new BarretenbergBackend(prMergeCircuit);
      noir = new Noir(prMergeCircuit);

      const from = "notifications@github.com";
      const organization = "Mach-34";
      const repo = "Grapevine";
      const fromBuffer = Buffer.from(from);
      const orgBuffer = Buffer.from(organization);
      const repoBuffer = Buffer.from(repo);

      const inputs = await generateEmailVerifierInputs(emails.pr_merge, {
        backend: CircuitBackend.Noir,
        maxBodyLength: 2816,
        maxHeadersLength: 1344
      },);

      const defaultNoirInputs = toNoirInputs(inputs, false);
      const emailHeaderBytes = Buffer.from(inputs.emailHeader.map(val => Number(val)));

      const noirInputs = {
        ...defaultNoirInputs,
        from_index: emailHeaderBytes.indexOf(fromBuffer),
        org_index: emailHeaderBytes.indexOf(orgBuffer),
        org_len: orgBuffer.length,
        repo_index: emailHeaderBytes.indexOf(repoBuffer),
        repo_len: repoBuffer.length
      };

      const { witness } = await noir.execute(noirInputs);
      const proof = await ultraHonk.generateProof(witness);
      const result = await ultraHonk.verifyProof(proof);
      expect(result).toBeTruthy();
      // const orgBytes = proof.publicInputs.map(val => parseInt(val, 16));
      // const extractedOrg = Buffer.from(orgBytes).toString();
      // expect(extractedOrg).toEqual(organization);

      // const repoBytes = proof.publicInputs.map(val => parseInt(val, 16)).filter(byte => byte > 0);
      // const extractedRepo = Buffer.from(repoBytes).toString();
      // expect(repo).toBe(extractedRepo);
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

  });
});
