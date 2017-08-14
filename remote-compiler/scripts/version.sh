#!/usr/bin/env bash
JAVA_VER=$(java -version 2>&1 >/dev/null | grep 'java version' | awk '{print $3}')
PYTHON_VER="$(python -V 2>&1)"
echo "{"
echo "\"java\":${JAVA_VER},"
echo "\"node\":\"$(node -v)\","
echo "\"python\":\"${PYTHON_VER}\""
echo "}"
