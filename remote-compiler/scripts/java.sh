#!/usr/bin/env bash
javac $1
IFS='/' read -a filePath <<< "$1"
IFS='.' read -a fileName <<< "${filePath[3]}"
cd "${filePath[0]}/${filePath[1]}/${filePath[2]}" && java Index $2
