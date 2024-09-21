use crate::{
    BODY_HASH_BASE64_LENGTH, GITHUB_ADDRESS_LEN, MAX_EMAIL_BODY_LENGTH, MAX_EMAIL_HEADER_LENGTH, 
    MAX_ADDRESS_LENGTH, MAX_GITHUB_ORG_LENGTH, MAX_GITHUB_REPO_LENGTH, MAX_ADDRESS_LOCAL_LENGTH, MAX_USERNAME_LENGTH,
};
use dep::string_search::{StringBody, SubString, SubString32, SubString64, StringBody2048};


/**
 * Decodes a base64 encoded body hash into a 32 byte sha256 hash of the body
 * @notice from https://github.com/richardliang/noir-rsa/blob/main/crates/rsa-biguint/src/lib.nr
 * 
 * @param encoded - the base 64 encoded body hash
 * @returns the decoded sha256 hash
 */
pub fn bodyhash_base64_decode(encoded: [u8; BODY_HASH_BASE64_LENGTH]) -> [u8; 32] {
    let mut total_bits = [0 as u1; BODY_HASH_BASE64_LENGTH * 6];
    for i in 0..BODY_HASH_BASE64_LENGTH {
        let translate = base64_lookup(encoded[i] as u8);
        // Store as big endian
        let translate_bits: [u1; 6] = (translate as Field).to_be_bits();
        for j in 0..6 {
            total_bits[i * 6 + j] = translate_bits[j];
        }
    }

    // Since we're returning the SHA256 hash, only need first 32 bytes (=256 bits)
    let mut output = [0 as u8; 32];
    for i in 0..32 {
        for j in 0..8 {
            // Convert from big endian back to little endian
            output[i] |= (total_bits[i * 8 + j] as u8) << (7 - j) as u8;
        }
    }

    output
}

/**
 * Lookup for the base 64 encoding
 * @todo: replace with noir_lang base64 lib
 *
 * @param input - the base 64 encoded character
 * @returns the decoded value
 */
fn base64_lookup(input: u8) -> u8 {
    // A-Z: 65-90
    if input >= 65 & input <= 90 {
        input - 65
    } else if input >= 97 & input <= 122 {
        // a-z: 97-122
        input - 71
    } else if input >= 48 & input <= 57 {
        // 0-9: 48-57
        input + 4
    } else if input == 43 {
        // +
        62
    } else if input == 47 {
        // /
        63
    } else {
        // =
        0
    }
}

/**
 * Extracts the base 64 encoded body hash from an email header
 *
 * @param header - the email header as validated in the DKIM signature
 * @param index - the asserted index to find the body hash at
 * @returns the base 64 encoded body hash
 */
pub fn get_body_hash(header: [u8; MAX_EMAIL_HEADER_LENGTH], index: u32) -> [u8; BODY_HASH_BASE64_LENGTH] {
    let mut body_hash = [0 as u8; BODY_HASH_BASE64_LENGTH];
    for i in 0..BODY_HASH_BASE64_LENGTH {
        body_hash[i] = header[index + i];
    }
    body_hash
}

pub fn extract_from(
    header: [u8; MAX_EMAIL_HEADER_LENGTH], 
    index: u32
) -> [u8; GITHUB_ADDRESS_LEN] {
    let mut from = [0 as u8; GITHUB_ADDRESS_LEN];
    for i in 0..GITHUB_ADDRESS_LEN {
        from[i] = header[i + index];
    }
    from
}

pub fn extract_to(
    header: [u8; MAX_EMAIL_HEADER_LENGTH],
    to_length: u32,
    index: u32
) -> [u8; MAX_ADDRESS_LENGTH] {
    let mut to = [0 as u8; MAX_ADDRESS_LENGTH];
    for i in 0..MAX_ADDRESS_LENGTH {
        if i < to_length {
            to[i] = header[i + index];
        }
    }
    to
}

pub fn extract_organization(
    header: [u8; MAX_EMAIL_HEADER_LENGTH],
    org_length: u32,
    index: u32
) -> [Field; MAX_GITHUB_ORG_LENGTH] {
    let mut organization = [0 as Field; MAX_GITHUB_ORG_LENGTH];
    for i in 0..MAX_GITHUB_ORG_LENGTH {
        if i < org_length {
            organization[i] = header[i + index] as Field;
        }
    }
    organization
}

pub fn extract_repository(
    header: [u8; MAX_EMAIL_HEADER_LENGTH],
    repo_length: u32,
    index: u32
) -> [Field; MAX_GITHUB_REPO_LENGTH] {
    let mut repository = [0 as Field; MAX_GITHUB_REPO_LENGTH];
    for i in 0..MAX_GITHUB_REPO_LENGTH {
        if i < repo_length {
            repository[i] = header[i + index] as Field;
        }
    }
    repository
}

// pub fn is_pr_merge(
//     header: [u8; MAX_EMAIL_HEADER_LENGTH],
//     header_length: u32,
// ) -> (bool, u32) {
//     // init the search params
//     let needle_text_init: [u8; 19] = "[Mach-34/Grapevine]".as_bytes();
//     let needle_start: SubString32 = SubString::new(needle_text_init, needle_text_init.len());

//     // init the search domain
//     let haystack: StringBody2048 = StringBody::new(header, header_length);
//     // // find the index of the position
//     haystack.substring_match(needle_start)    
// }