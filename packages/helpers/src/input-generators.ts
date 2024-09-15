import { Uint8ArrayToCharArray, toCircomBigIntBytes } from "./binary-format";
import { MAX_BODY_PADDED_BYTES, MAX_HEADER_PADDED_BYTES } from "./constants";
import { DKIMVerificationResult, verifyDKIMSignature } from "./dkim";
import { generatePartialSHA, sha256Pad } from "./sha-utils";
import * as NoirRedc from "noir_redc";

export enum CircuitBackend {
  Circom = "circom",
  Noir = "noir",
}

type CircuitInput = {
  emailHeader: string[];
  emailHeaderLength: string;
  emailHeaderLengthUnpadded?: string;
  pubkey: string[];
  redc_params?: string[];
  signature: string[];
  emailBody?: string[];
  emailBodyLength?: string;
  emailBodyLengthUnpadded?: string;
  precomputedSHA?: string[];
  bodyHashIndex?: string;
  decodedEmailBodyIn?: string[];
  headerMask?: number[];
  bodyMask?: number[];
};

type InputGenerationArgs = {
  ignoreBodyHashCheck?: boolean;
  enableHeaderMasking?: boolean;
  enableBodyMasking?: boolean;
  shaPrecomputeSelector?: string;
  maxHeadersLength?: number; // Max length of the email header including padding
  maxBodyLength?: number; // Max length of the email body after shaPrecomputeSelector including padding
  removeSoftLineBreaks?: boolean;
  headerMask?: number[];
  bodyMask?: number[];
  backend?: CircuitBackend;
};

function removeSoftLineBreaks(body: string[]): string[] {
  const result = [];
  let i = 0;
  while (i < body.length) {
    if (
      i + 2 < body.length &&
      body[i] === "61" && // '=' character
      body[i + 1] === "13" && // '\r' character
      body[i + 2] === "10"
    ) {
      // '\n' character
      // Skip the soft line break sequence
      i += 3; // Move past the soft line break
    } else {
      result.push(body[i]);
      i++;
    }
  }
  // Pad the result with zeros to make it the same length as the body
  while (result.length < body.length) {
    result.push("0");
  }
  return result;
}

/**
 *
 * @description Generate circuit inputs for the EmailVerifier circuit from raw email content
 * @param rawEmail Full email content as a buffer or string
 * @param params Arguments to control the input generation
 * @returns Circuit inputs for the EmailVerifier circuit
 */
export async function generateEmailVerifierInputs(
  rawEmail: Buffer | string,
  params: InputGenerationArgs = {}
) {
  const dkimResult = await verifyDKIMSignature(rawEmail);

  return generateEmailVerifierInputsFromDKIMResult(dkimResult, params);
}

/**
 *
 * @description Generate circuit inputs for the EmailVerifier circuit from DKIMVerification result
 * @param dkimResult DKIMVerificationResult containing email data and verification result
 * @param params Arguments to control the input generation
 * @returns Circuit inputs for the EmailVerifier circuit
 */
export function generateEmailVerifierInputsFromDKIMResult(
  dkimResult: DKIMVerificationResult,
  params: InputGenerationArgs = {}
): CircuitInput {
  const { headers, body, bodyHash, publicKey, signature } = dkimResult;

  // SHA add padding
  const [messagePadded, messagePaddedLen] = sha256Pad(
    headers,
    params.maxHeadersLength || MAX_HEADER_PADDED_BYTES
  );

  const circuitInputs: CircuitInput = {
    emailHeader: Uint8ArrayToCharArray(messagePadded), // Packed into 1 byte signals
    emailHeaderLength:
      params.backend === CircuitBackend.Noir
        ? headers.length.toString()
        : messagePaddedLen.toString(),
    pubkey:
      params.backend === CircuitBackend.Noir
        ? NoirRedc.bn_limbs_from_string(publicKey.toString(16))
        : toCircomBigIntBytes(publicKey),
    signature:
      params.backend === CircuitBackend.Noir
        ? NoirRedc.bn_limbs_from_string(signature.toString(16))
        : toCircomBigIntBytes(signature),
    ...(params.backend === CircuitBackend.Noir && {
      redc_params: NoirRedc.redc_limbs_from_string(publicKey.toString(16)),
    }),
  };

  if (params.enableHeaderMasking) {
    circuitInputs.headerMask = params.headerMask;
  }
  
  if (!params.ignoreBodyHashCheck) {
    if (!body || !bodyHash) {
      throw new Error(
        "body and bodyHash are required when ignoreBodyHashCheck is false"
      );
    }

    const bodyHashIndex = headers.toString().indexOf(bodyHash);
    const maxBodyLength = params.maxBodyLength || MAX_BODY_PADDED_BYTES;

    // 65 comes from the 64 at the end and the 1 bit in the start, then 63 comes from the formula to round it up to the nearest 64.
    // see sha256algorithm.com for a more full explanation of padding length
    const bodySHALength = Math.floor((body.length + 63 + 65) / 64) * 64;
    const [bodyPadded, bodyPaddedLen] = sha256Pad(
      body,
      Math.max(maxBodyLength, bodySHALength)
    );

    const { precomputedSha, bodyRemaining, bodyRemainingLength } =
      generatePartialSHA({
        body: bodyPadded,
        bodyLength: bodyPaddedLen,
        selectorString: params.shaPrecomputeSelector,
        maxRemainingBodyLength: maxBodyLength,
      });

    circuitInputs.emailBodyLength =
      params.backend === CircuitBackend.Noir
        ? body.length.toString()
        : bodyRemainingLength.toString();
    circuitInputs.precomputedSHA = Uint8ArrayToCharArray(precomputedSha);
    circuitInputs.bodyHashIndex = bodyHashIndex.toString();
    circuitInputs.emailBody = Uint8ArrayToCharArray(bodyRemaining);

    if (params.removeSoftLineBreaks) {
      circuitInputs.decodedEmailBodyIn = removeSoftLineBreaks(
        circuitInputs.emailBody
      );
    }

    if (params.enableBodyMasking) {
      circuitInputs.bodyMask = params.bodyMask;
    }
  }

  return circuitInputs;
}

export function toNoirInputs(inputs: CircuitInput, exactLength = true) {

  return {
    body_hash_index: inputs.bodyHashIndex!,
    header: exactLength
    ? inputs.emailHeader.slice(0, Number(inputs.emailHeaderLength))!
    : inputs.emailHeader!,
    body: exactLength
    ? inputs.emailBody!.slice(0, Number(inputs.emailBodyLength))!
    : inputs.emailBody!,
    body_length: inputs.emailBodyLength!,
    header_length: inputs.emailHeaderLength!,
    pubkey_modulus_limbs: inputs.pubkey!,
    redc_params_limbs: inputs.redc_params!,
    signature: { limbs: inputs.signature! },
  };
}
