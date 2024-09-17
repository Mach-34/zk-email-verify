#!/bin/bash
cd email-verifier-1024
nargo compile --force
cd ../email-verifier-2048
nargo compile --force
cd ..