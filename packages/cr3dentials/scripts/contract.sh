#!/bin/bash

## Write Verifier Key
bb write_vk_ultra_honk -b ../target/noir_zkemail.json
## Write Contract
bb contract_ultra_honk -v ../target/vk