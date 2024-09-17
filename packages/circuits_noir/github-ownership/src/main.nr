use dep::noir_rsa::bignum::BigNum;
use dep::noir_rsa::bignum::runtime_bignum::BigNumInstance;
use dep::noir_rsa::bignum::fields::Params1024;
use dep::noir_rsa::types::RSA;
use dep::std::hash::{sha256_var, pedersen_hash};
use dep::string_search::{StringBody, SubString, StringBody512, SubString32, SubString64};

mod utils;

type BN1024 = BigNum<BN_LIMBS, Params1024>;
type RSA1024 = RSA<BN1024, BigNumInstance<BN_LIMBS, Params1024>, 128>;

global BN_LIMBS: u32 = 9;
global BODY_HASH_BASE64_LENGTH: u32 = 44;
global MAX_EMAIL_HEADER_LENGTH: u32 = 768;
global MAX_EMAIL_BODY_LENGTH: u32 = 512;
global RSA_EXPONENT: u32 = 65537;
global MAX_ADDRESS_LOCAL_LENGTH = 64; // the max part before @ in the email address
global TO_DOMAIN_LENGTH: u32 = 10;
global TO_DOMAIN: [u8; TO_DOMAIN_LENGTH] = "@gmail.com".as_bytes(); // example of string search

fn main(
    body_hash_index: u32,
    header: [u8; MAX_EMAIL_HEADER_LENGTH],
    header_length: u32,
    body: [u8; MAX_EMAIL_BODY_LENGTH],
    body_length: u32,
    pubkey_modulus_limbs: [Field; BN_LIMBS],
    redc_params_limbs: [Field; BN_LIMBS],
    signature: BN1024,
    padded_recipient_local: [u8; MAX_ADDRESS_LOCAL_LENGTH],
    recipient_local_length: u32
) -> pub Field {
    // check the body and header lengths are within bounds
    assert(header_length <= MAX_EMAIL_HEADER_LENGTH);
    assert(body_length <= MAX_EMAIL_BODY_LENGTH);

    // instantiate the BNInstance for the pubkey
    let pubkey: BigNumInstance<BN_LIMBS, Params1024> = BigNumInstance::new(pubkey_modulus_limbs, redc_params_limbs);

    // hash the header
    let header_hash = sha256_var(header, header_length as u64);

    // verify the DKIM signature over the header
    let rsa: RSA1024 = RSA {};
    assert(rsa.verify_sha256_pkcs1v15(pubkey, header_hash, signature, RSA_EXPONENT));

    // get the body hash from the header and base64 decode it
    let body_hash = utils::get_body_hash(header, body_hash_index);
    let decoded_body_hash = utils::bodyhash_base64_decode(body_hash);

    // hash the body
    let body_hash: [u8; 32] = sha256_var(body, body_length as u64);

    // verify the body hash
    assert(body_hash == decoded_body_hash);

    // string search for the asserted recipient domain
    let (found, index) = utils::find_to_index(header, padded_recipient_local, recipient_local_length, header_length);
    assert(found);

    // extract the recipient domain
    // let recipient_domain = utils::extract_expected_recipient_domain(header, recipient_local_length, index);
    // assert(recipient_domain == TO_DOMAIN);


    // hash the pubkey modulus to get a single field element for pub output
    pedersen_hash(pubkey_modulus_limbs)
}
