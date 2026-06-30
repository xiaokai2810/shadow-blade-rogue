#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_ID="com.shadowblade.rogue"
APP_ID_PATH="$(printf '%s' "$APP_ID" | tr . /)"
APP_DIR="$ROOT_DIR/app/src/main"
BUILD_DIR="$ROOT_DIR/build"
TOOLS_DIR="${ANDROID_BUILD_TOOLS:-}"
PLATFORM_JAR="${ANDROID_PLATFORM_JAR:-}"

if [[ -z "${JAVA_HOME:-}" || ! -x "$JAVA_HOME/bin/javac" ]]; then
  echo "JAVA_HOME must point to a JDK with javac." >&2
  exit 1
fi

if [[ -z "$TOOLS_DIR" || ! -x "$TOOLS_DIR/aapt2" || ! -x "$TOOLS_DIR/d8" || ! -x "$TOOLS_DIR/apksigner" || ! -x "$TOOLS_DIR/zipalign" ]]; then
  echo "ANDROID_BUILD_TOOLS must point to an Android build-tools directory." >&2
  exit 1
fi

if [[ -z "$PLATFORM_JAR" || ! -f "$PLATFORM_JAR" ]]; then
  echo "ANDROID_PLATFORM_JAR must point to android.jar." >&2
  exit 1
fi

rm -rf "$BUILD_DIR/intermediates"
mkdir -p \
  "$BUILD_DIR/intermediates/res" \
  "$BUILD_DIR/intermediates/gen" \
  "$BUILD_DIR/intermediates/classes" \
  "$BUILD_DIR/intermediates/dex" \
  "$BUILD_DIR/outputs"

"$TOOLS_DIR/aapt2" compile --dir "$APP_DIR/res" -o "$BUILD_DIR/intermediates/resources.zip"

"$TOOLS_DIR/aapt2" link \
  -o "$BUILD_DIR/intermediates/base-unsigned.apk" \
  -I "$PLATFORM_JAR" \
  --manifest "$APP_DIR/AndroidManifest.xml" \
  --java "$BUILD_DIR/intermediates/gen" \
  --min-sdk-version 23 \
  --target-sdk-version 35 \
  --version-code 1 \
  --version-name 0.1.0 \
  -A "$APP_DIR/assets" \
  "$BUILD_DIR/intermediates/resources.zip"

"$JAVA_HOME/bin/javac" \
  -encoding UTF-8 \
  -source 1.8 \
  -target 1.8 \
  -bootclasspath "$PLATFORM_JAR" \
  -d "$BUILD_DIR/intermediates/classes" \
  "$BUILD_DIR/intermediates/gen/$APP_ID_PATH/R.java" \
  "$APP_DIR/java/com/shadowblade/rogue/MainActivity.java"

"$JAVA_HOME/bin/jar" cf "$BUILD_DIR/intermediates/classes.jar" \
  -C "$BUILD_DIR/intermediates/classes" .

"$TOOLS_DIR/d8" \
  --lib "$PLATFORM_JAR" \
  --min-api 23 \
  --output "$BUILD_DIR/intermediates/dex" \
  "$BUILD_DIR/intermediates/classes.jar"

cp "$BUILD_DIR/intermediates/base-unsigned.apk" "$BUILD_DIR/intermediates/with-dex.apk"
(cd "$BUILD_DIR/intermediates/dex" && zip -q -r "$BUILD_DIR/intermediates/with-dex.apk" classes.dex)

KEYSTORE="$BUILD_DIR/debug.keystore"
if [[ ! -f "$KEYSTORE" ]]; then
  "$JAVA_HOME/bin/keytool" -genkeypair \
    -keystore "$KEYSTORE" \
    -storepass android \
    -keypass android \
    -alias androiddebugkey \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -dname "CN=Android Debug,O=Android,C=US"
fi

"$TOOLS_DIR/zipalign" -f -p 4 \
  "$BUILD_DIR/intermediates/with-dex.apk" \
  "$BUILD_DIR/intermediates/aligned.apk"

"$TOOLS_DIR/apksigner" sign \
  --ks "$KEYSTORE" \
  --ks-pass pass:android \
  --key-pass pass:android \
  --out "$BUILD_DIR/outputs/shadow-blade-rogue-debug.apk" \
  "$BUILD_DIR/intermediates/aligned.apk"

"$TOOLS_DIR/apksigner" verify --verbose "$BUILD_DIR/outputs/shadow-blade-rogue-debug.apk"
echo "$BUILD_DIR/outputs/shadow-blade-rogue-debug.apk"
