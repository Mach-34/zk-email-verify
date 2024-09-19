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
global MAX_EMAIL_HEADER_LENGTH: u32 = 1344;
global MAX_EMAIL_BODY_LENGTH: u32 = 2816;
global MAX_USERNAME_LENGTH: u32 = 25; // TODO: change
global RSA_EXPONENT: u32 = 65537;
global MAX_ADDRESS_LOCAL_LENGTH = 64; // the max part before @ in the email address
global MAX_ADDRESS_LENGTH = 320;
global MAX_GITHUB_ORG_LENGTH = 39;
global MAX_GITHUB_REPO_LENGTH = 100;
global TO_DOMAIN_LENGTH: u32 = 10;
global TO_DOMAIN: [u8; TO_DOMAIN_LENGTH] = "@gmail.com".as_bytes(); // example of string search
global GITHUB_ADDRESS = "notifications@github.com".as_bytes();
global GITHUB_ADDRESS_LEN = 24;

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
    org_index: u32,
    org_len: u32,
    repo_index: u32,
    repo_len: u32,
    // to_index: u32,
    // to_len: u32,
    // username_index: u32,
    // username_len: u32,
) -> pub [u8; MAX_GITHUB_REPO_LENGTH] {
    // instantiate the BNInstance for the pubkey
    let pubkey: BigNumInstance<BN_LIMBS, Params1024> = BigNumInstance::new(pubkey_modulus_limbs, redc_params_limbs);

    // hash the header
    let header_hash = sha256_var(header, header_length as u64);

    // verify the DKIM signature over the header
    let rsa: RSA1024 = RSA {};
    assert(rsa.verify_sha256_pkcs1v15(pubkey, header_hash, signature, RSA_EXPONENT));

    // extract "from" and check that equivalent to noreply@github.com
    let extracted_from = utils::extract_from(header, from_index);
    assert(extracted_from == GITHUB_ADDRESS);

    let (found) = utils::is_pr_merge(header, header_length);
    assert(found);

    // extract to and assert its hash is equal to provided hash
    // let extracted_to = utils::extract_to(header, header_length);

    // extract org name
    // let extracted_org = utils::extract_organization(header, org_len, org_index);

    // extract repo name
    let extracted_repo = utils::extract_repository(header, repo_len, repo_index);

    extracted_repo
}
