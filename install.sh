#!/bin/sh
# OpenSource Hub 1-Line POSIX Installer (macOS & Linux)
# Installs standalone binary without Node.js prerequisite.
# Usage: curl -fsSL https://raw.githubusercontent.com/bengowtham70/opensource-hub/main/install.sh | sh

set -e

REPO_SLUG="bengowtham70/opensource-hub"
BINARY_NAME="opensource-hub"

echo "=== Installing OpenSource Hub ==="

# 1. Detect Operating System
OS="$(uname -s)"
case "$OS" in
  Darwin*) OS_TARGET="darwin" ;;
  Linux*)  OS_TARGET="linux" ;;
  *)
    echo "Error: Unsupported operating system '$OS'. OpenSource Hub binaries support Linux and macOS." >&2
    echo "For Windows, run: irm https://raw.githubusercontent.com/$REPO_SLUG/main/install.ps1 | iex" >&2
    exit 1
    ;;
esac

# 2. Detect CPU Architecture
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64|amd64)   ARCH_TARGET="x64" ;;
  arm64|aarch64)  ARCH_TARGET="arm64" ;;
  *)
    echo "Error: Unsupported CPU architecture '$ARCH'. Supported: x64, arm64." >&2
    exit 1
    ;;
esac

TARGET="${OS_TARGET}-${ARCH_TARGET}"
echo "Detected platform: ${TARGET}"

# 3. Determine latest version
if [ -z "$OSH_VERSION" ]; then
  LATEST_RELEASE_URL="https://api.github.com/repos/${REPO_SLUG}/releases/latest"
  if command -v curl >/dev/null 2>&1; then
    VERSION="$(curl -fsSL "$LATEST_RELEASE_URL" 2>/dev/null | grep '"tag_name":' | sed -E 's/.*"tag_name": *"v?([^"]+)".*/\1/' || true)"
  elif command -v wget >/dev/null 2>&1; then
    VERSION="$(wget -qO- "$LATEST_RELEASE_URL" 2>/dev/null | grep '"tag_name":' | sed -E 's/.*"tag_name": *"v?([^"]+)".*/\1/' || true)"
  fi
fi

# Fallback version if API is rate-limited or unauthenticated
if [ -z "$VERSION" ]; then
  VERSION="0.1.0"
fi

VERSION="${VERSION#v}"
ASSET_NAME="${BINARY_NAME}-v${VERSION}-${TARGET}"
DOWNLOAD_BASE="https://github.com/${REPO_SLUG}/releases/download/v${VERSION}"
BINARY_URL="${DOWNLOAD_BASE}/${ASSET_NAME}"
SUMS_URL="${DOWNLOAD_BASE}/SHA256SUMS.txt"

# 4. Create Temporary Working Directory
TMP_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t 'osh-install')"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "Downloading ${BINARY_NAME} v${VERSION} (${TARGET})..."

if command -v curl >/dev/null 2>&1; then
  curl -fsSL "$BINARY_URL" -o "${TMP_DIR}/${BINARY_NAME}"
  curl -fsSL "$SUMS_URL" -o "${TMP_DIR}/SHA256SUMS.txt" 2>/dev/null || true
elif command -v wget >/dev/null 2>&1; then
  wget -qO "${TMP_DIR}/${BINARY_NAME}" "$BINARY_URL"
  wget -qO "${TMP_DIR}/SHA256SUMS.txt" "$SUMS_URL" 2>/dev/null || true
else
  echo "Error: Neither curl nor wget was found. Please install either curl or wget." >&2
  exit 1
fi

# 5. Optional Checksum Verification
if [ -f "${TMP_DIR}/SHA256SUMS.txt" ]; then
  EXPECTED_SHA="$(grep "${ASSET_NAME}" "${TMP_DIR}/SHA256SUMS.txt" 2>/dev/null | awk '{print $1}' || true)"
  if [ -n "$EXPECTED_SHA" ]; then
    echo "Verifying SHA256 checksum..."
    if command -v sha256sum >/dev/null 2>&1; then
      ACTUAL_SHA="$(sha256sum "${TMP_DIR}/${BINARY_NAME}" | awk '{print $1}')"
    elif command -v shasum >/dev/null 2>&1; then
      ACTUAL_SHA="$(shasum -a 256 "${TMP_DIR}/${BINARY_NAME}" | awk '{print $1}')"
    fi
    if [ -n "$ACTUAL_SHA" ] && [ "$ACTUAL_SHA" != "$EXPECTED_SHA" ]; then
      echo "Error: Checksum mismatch! Download may be corrupted or tampered with." >&2
      echo "Expected: $EXPECTED_SHA" >&2
      echo "Actual:   $ACTUAL_SHA" >&2
      exit 1
    fi
    echo "Checksum verified: ${EXPECTED_SHA}"
  fi
fi

# 6. Determine Installation Target Directory
chmod +x "${TMP_DIR}/${BINARY_NAME}"

INSTALL_DIR="/usr/local/bin"
if [ ! -w "$INSTALL_DIR" ] || [ "$(id -u 2>/dev/null || echo 1)" != "0" ]; then
  INSTALL_DIR="${HOME}/.local/bin"
  mkdir -p "$INSTALL_DIR"
fi

echo "Installing binary to ${INSTALL_DIR}/${BINARY_NAME}..."
mv "${TMP_DIR}/${BINARY_NAME}" "${INSTALL_DIR}/${BINARY_NAME}"
chmod +x "${INSTALL_DIR}/${BINARY_NAME}"

echo ""
echo "Successfully installed OpenSource Hub v${VERSION}!"
echo ""

# 7. Verify PATH availability
case ":$PATH:" in
  *":$INSTALL_DIR:"*) ;;
  *)
    echo "Notice: ${INSTALL_DIR} is not currently in your \$PATH."
    echo "Add it to your shell configuration profile (e.g. ~/.bashrc, ~/.zshrc):"
    echo "  export PATH=\"\$PATH:${INSTALL_DIR}\""
    echo ""
    ;;
esac

echo "To launch OpenSource Hub immediately, run:"
echo "  ${BINARY_NAME}"
echo ""
