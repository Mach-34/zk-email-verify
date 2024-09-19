#!/bin/bash
cd email-verifier-1024
## Write Verifier Key
bb write_vk_ultra_honk -b ./target/noir_zkemail_1024.json -o ./target/vk_1024_honk
## Write Contract
bb contract_ultra_honk -v ./target/vk_1024_honk -o ./target/contract_1024_honk.sol

bb write_vk -b ./target/noir_zkemail_1024.json -o ./target/vk_1024_plonk
bb contract -v ./target/vk_1024_plonk -o ./target/contract_1024_plonk.sol
cd - 
# cd email-verifier-2048
# bb write_vk_ultra_honk -b ../target/noir_zkemail_2048.json
# ## Write Contract
# bb contract_ultra_honk -v ../target/vk