#!/bin/bash
cd v1
## Compile for small email
### Compile small email ACIR
nargo compile --force
mv ./target/noir_zkemail.json ./target/small_email.json
### Change the header and body sizes
case "$OSTYPE" in
darwin*)
    # macOS
    sed -i '' 's|u32 = 472|u32 = 470|' ./src/main.nr
    sed -i '' 's|u32 = 24|u32 = 740|' ./src/main.nr
    ;;
*)
    # Linux
    sed -i 's|u32 = 472|u32 = 470|' ./src/main.nr
    sed -i 's|u32 = 24|u32 = 740|' ./src/main.nr
    ;;
esac
### Compile big email ACIR
nargo compile --force
mv ./target/noir_zkemail.json ./target/large_email.json
### Restore the header and body sizes
case "$OSTYPE" in
darwin*)
    # macOS
    sed -i '' 's|u32 = 470|u32 = 472|' ./src/main.nr
    sed -i '' 's|u32 = 740|u32 = 24|' ./src/main.nr
    ;;
*)
    # Linux
    sed -i 's|u32 = 470|u32 = 472|' ./src/main.nr
    sed -i 's|u32 = 740|u32 = 24|' ./src/main.nr
    ;;
esac
# cd ../v2
# nargo compile --force
cd ..
