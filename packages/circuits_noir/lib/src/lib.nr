use dep::noir_rsa::bignum::BigNum;
use dep::noir_rsa::bignum::runtime_bignum::BigNumInstance;
use dep::noir_rsa::bignum::fields::Params2048;
use dep::noir_rsa::types::RSA;
use dep::std::hash::{sha256_var, pedersen_hash};

mod utils;

type BN2048 = BigNum<18, Params2048>;
type RSA2048 = RSA<BN2048, BigNumInstance<18, Params2048>, 256>;

global BODY_HASH_BASE64_LENGTH: u32 = 44;
global MAX_EMAIL_HEADER_LENGTH: u32 = 1024;
global MAX_EMAIL_BODY_LENGTH: u32 = 1536;
global RSA_EXPONENT: u32 = 65537;

fn verify_email(
    body_hash_index: u32,
    header: [u8; MAX_EMAIL_HEADER_LENGTH],
    header_length: u32,
    body: [u8; MAX_EMAIL_BODY_LENGTH],
    body_length: u32,
    pubkey_modulus_limbs: [Field; 18],
    redc_params_limbs: [Field; 18],
    signature: BN2048,

) -> pub Field {
    // check the body and header lengths are within bounds
    assert(header_length <= MAX_EMAIL_HEADER_LENGTH);
    assert(body_length <= MAX_EMAIL_BODY_LENGTH);

    // instantiate the BNInstance for the pubkey
    let pubkey: BigNumInstance<18, Params2048> = BigNumInstance::new(pubkey_modulus_limbs, redc_params_limbs);

    // hash the header
    let header_hash = sha256_var(header, header_length as u64);

    // verify the DKIM signature over the header
    let rsa: RSA2048 = RSA {};
    assert(rsa.verify_sha256_pkcs1v15(pubkey, header_hash, signature, RSA_EXPONENT));

    // get the body hash from the header and base64 decode it
    let body_hash = utils::get_body_hash(header, body_hash_index);
    let decoded_body_hash = utils::bodyhash_base64_decode(body_hash);

    // hash the body
    let body_hash: [u8; 32] = sha256_var(body, body_length as u64);

    // verify the body hash
    assert(body_hash == decoded_body_hash);

    // hash the pubkey modulus to get a single field element for pub output
    pedersen_hash(pubkey_modulus_limbs)
}

