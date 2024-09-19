/**
 * Generate a hash of the limbs of the DKIM signature nullify the use of the email
 *
 * @param N - The number of limbs in the DKIM signature
 * @param signature - The DKIM signature
 * @return - The nullifier for the email
 */
pub fn email_nullifier<let N: u32>(signature: [Field; N]) -> Field {
    std::hash::pedersen_hash(signature)
}