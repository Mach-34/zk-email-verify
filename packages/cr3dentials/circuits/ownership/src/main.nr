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
global MAX_EMAIL_HEADER_LENGTH: u32 = 1024;
global MAX_EMAIL_BODY_LENGTH: u32 = 896;
global MAX_USERNAME_LENGTH: u32 = 25; // TODO: change
global RSA_EXPONENT: u32 = 65537;
global MAX_ADDRESS_LOCAL_LENGTH = 64; // the max part before @ in the email address
global MAX_ADDRESS_LENGTH = 320;
global TO_DOMAIN_LENGTH: u32 = 10;
global TO_DOMAIN: [u8; TO_DOMAIN_LENGTH] = "@gmail.com".as_bytes(); // example of string search
global GITHUB_ADDRESS = "noreply@github.com".as_bytes();
global GITHUB_ADDRESS_LEN = 18;


fn verify_email(    
    body_hash_index: u32,
    header: [u8; MAX_EMAIL_HEADER_LENGTH],
    header_length: u32,
    body: [u8; MAX_EMAIL_BODY_LENGTH],
    body_length: u32,
    pubkey_modulus_limbs: [Field; BN_LIMBS],
    redc_params_limbs: [Field; BN_LIMBS],
    signature: BN1024
) {
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
}

fn main(
    body_hash_index: u32,
    header: [u8; MAX_EMAIL_HEADER_LENGTH],
    header_length: u32,
    body: [u8; MAX_EMAIL_BODY_LENGTH],
    body_length: u32,
    pubkey_modulus_limbs: [Field; BN_LIMBS],
    redc_params_limbs: [Field; BN_LIMBS],
    signature: BN1024,
    from_index: u32,
    to_index: u32,
    to_len: u32,
    username_index: u32,
    username_len: u32,
) -> pub [Field; 2] {

    // verify dkim signature
    // verify_email(body_hash_index, header, header_length, body, body_length, pubkey_modulus_limbs, redc_params_limbs, signature);

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

    // extract "from" and check that equivalent to noreply@github.com
    let extracted_from = utils::extract_from(header, from_index);
    assert(extracted_from == GITHUB_ADDRESS);

    // assert this is a password reset email from github
    let (found) = utils::is_password_reset_email(body, body_length);
    assert(found);

    // extract to email and hash
    let to = utils::extract_to(header, to_len, to_index);
    let to_hash = std::hash::pedersen_hash(to);

    // extract username and hash
    let username = utils::extract_username(body, username_len, username_index);
    let username_hash = std::hash::pedersen_hash(username);

    [to_hash, username_hash]
}
