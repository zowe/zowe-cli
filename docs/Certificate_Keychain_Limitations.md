# macOS Keychain Certificate Limitations and Workarounds

## Overview

When using `certAccount` and `certKeyAccount` properties to authenticate with certificates stored in macOS Keychain, you may encounter an issue where the **certificate** is successfully retrieved but the **private key** cannot be exported. This document explains why this happens and provides several workarounds.

## The Problem

### Error Message

```
Private key export not supported - identity found but key cannot be exported for account 'User BJSIMM on tvt4002'
Please provide certKeyFile or import certificate with exportable private key
```

### Root Cause

macOS Keychain protects private keys from programmatic export as a security feature. When a certificate/key pair is imported into the Keychain, the private key can be marked as:

- **Exportable**: Can be retrieved programmatically
- **Non-Exportable**: Cannot be retrieved programmatically (default for many imports)

The Zowe CLI can retrieve the **certificate** from the Keychain (which is always exportable), but cannot retrieve the **private key** if it was imported with the non-exportable flag.

### Why This Matters

TLS client authentication requires **both** the certificate and private key. Node.js HTTPS client (used by Zowe CLI) needs both as files or buffers. If the private key cannot be exported from the Keychain, authentication will fail.

## How to Check if Your Key is Exportable

Try exporting your identity manually:

```bash
security export -k ~/Library/Keychains/login.keychain-db -t identities -f pkcs12 -o /tmp/test.p12 -P password
```

**If you see**:
- `SecKeychainItemExport: The contents of this item cannot be retrieved.` → Your key is **non-exportable**
- A successful export → Your key is **exportable** (but Zowe CLI may still have issues - see workarounds below)

## Workarounds

### Option 1: Provide Private Key File Separately (Recommended)

The simplest workaround is to provide the private key as a file instead of using `certKeyAccount`.

**Step 1**: Export your certificate to a file (this always works):

```bash
# Find your certificate identity
security find-identity -p ssl-client -v

# Export certificate only (not private key)
security find-certificate -c "User BJSIMM on tvt4002" -p > ~/my-cert.pem
```

**Step 2**: Obtain your private key file separately (from wherever you originally received it)

**Step 3**: Update your profile to use file paths:

```json
{
  "profiles": {
    "my-profile": {
      "type": "zosmf",
      "properties": {
        "host": "example.com",
        "port": 443,
        "certFile": "/Users/yourname/my-cert.pem",
        "certKeyFile": "/Users/yourname/my-key.pem",
        "authOrder": ["cert-pem"]
      }
    }
  }
}
```

**Pros**:
- ✅ Simple and reliable
- ✅ Works with any key
- ✅ No re-import needed

**Cons**:
- ❌ Keys stored as files (less secure than Keychain)
- ❌ Need to secure file permissions (`chmod 600`)

---

### Option 2: Re-import Certificate with Exportable Private Key

Re-import your certificate into the Keychain with the exportable flag enabled.

**Step 1**: Export your current identity to P12 format (if possible):

```bash
# Try to export (may fail if key is non-exportable)
security export -k ~/Library/Keychains/login.keychain-db \
  -t identities \
  -f pkcs12 \
  -o ~/my-identity.p12 \
  -P yourpassword
```

If this fails, you'll need the original P12 file or separate certificate/key files.

**Step 2**: Delete the existing identity from Keychain:

```bash
# Find the certificate
security find-certificate -c "User BJSIMM on tvt4002" -a

# Delete it (use the identity hash from find-identity output)
security delete-identity -Z 5C41897F72421CF44341536D44971EA44E8C42C6
```

**Step 3**: Re-import with exportable flag:

```bash
# Import P12 with extractable/exportable flag
security import ~/my-identity.p12 \
  -k ~/Library/Keychains/login.keychain-db \
  -t cert \
  -f pkcs12 \
  -P yourpassword \
  -x \
  -T /usr/bin/security \
  -T /usr/bin/codesign
```

**Flags explained**:
- `-x`: Mark private key as **extractable** (exportable)
- `-T /usr/bin/security`: Allow security command to access without prompt
- `-T /usr/bin/codesign`: Allow codesign to access without prompt

**Step 4**: Verify the key is now exportable:

```bash
security export -k ~/Library/Keychains/login.keychain-db \
  -t identities \
  -f pkcs12 \
  -o /tmp/test.p12 \
  -P testpass
```

Should now succeed!

**Step 5**: Continue using `certAccount` in your profile (no changes needed)

**Pros**:
- ✅ Keys remain in secure Keychain storage
- ✅ Works with existing `certAccount` configuration
- ✅ More secure than file storage

**Cons**:
- ❌ Requires re-importing certificate
- ❌ Need access to original P12 or key files
- ❌ Slightly more complex process

---

### Option 3: Use PKCS#12 (P12) Files Directly

Instead of using Keychain, provide P12 files directly.

**Step 1**: Obtain or create a P12 file containing both certificate and private key:

```bash
# If you have separate cert and key files, create P12:
openssl pkcs12 -export \
  -in my-cert.pem \
  -inkey my-key.pem \
  -out my-identity.p12 \
  -name "My Identity" \
  -passout pass:yourpassword
```

**Step 2**: Configure profile to use P12 file:

Currently, Zowe CLI expects separate certificate and key files. A future enhancement could add direct P12 support. For now, extract from P12:

```bash
# Extract certificate
openssl pkcs12 -in my-identity.p12 -clcerts -nokeys -out my-cert.pem -passin pass:yourpassword

# Extract private key
openssl pkcs12 -in my-identity.p12 -nocerts -nodes -out my-key.pem -passin pass:yourpassword
```

Then use Option 1 above with the extracted files.

**Pros**:
- ✅ Portable across systems
- ✅ Industry-standard format
- ✅ Can be password-protected

**Cons**:
- ❌ Currently requires extraction to separate files
- ❌ Files need secure storage
- ❌ Not using Keychain security

---

### Option 4: Use Secure Configuration with certFile/certKeyFile

Store file paths in the Zowe configuration but keep actual files secure.

**Step 1**: Place certificate and key files in a secure location:

```bash
mkdir -p ~/.zowe/certs
chmod 700 ~/.zowe/certs

cp my-cert.pem ~/.zowe/certs/
cp my-key.pem ~/.zowe/certs/

chmod 600 ~/.zowe/certs/my-cert.pem
chmod 600 ~/.zowe/certs/my-key.pem
```

**Step 2**: Reference in profile:

```json
{
  "profiles": {
    "my-profile": {
      "type": "zosmf",
      "properties": {
        "host": "example.com",
        "port": 443,
        "certFile": "~/.zowe/certs/my-cert.pem",
        "certKeyFile": "~/.zowe/certs/my-key.pem",
        "authOrder": ["cert-pem"]
      }
    }
  }
}
```

**Pros**:
- ✅ Files in known secure location
- ✅ Proper file permissions
- ✅ Easy to back up

**Cons**:
- ❌ Not using Keychain encryption
- ❌ Files accessible if system compromised
- ❌ Manual permission management

---

## Future Enhancements

### Planned Features

1. **Direct P12 Support**: Native parsing of P12 files without extraction
2. **macOS Native TLS**: Integration with macOS Security framework to use non-exportable keys directly
3. **Automatic Detection**: Detect non-exportable keys and prompt for alternatives
4. **Key Import Tool**: CLI command to import certificates with correct flags

### Technical Limitations

The fundamental issue is that Node.js HTTPS client (which Zowe uses) requires certificate and key as files or buffers. macOS won't export non-exportable keys for security reasons. Solutions require either:

1. **Making keys exportable** (Option 2 above)
2. **Using alternative storage** (Options 1, 3, 4 above)
3. **Deep architectural change** (using macOS native TLS instead of Node.js)

## Comparison of Workarounds

| Option | Security | Complexity | Keychain Integration | Requires Re-import |
|--------|----------|------------|---------------------|-------------------|
| Option 1: File-based | Medium | Low | No | No |
| Option 2: Re-import | High | Medium | Yes | Yes |
| Option 3: P12 files | Medium | Low | No | No |
| Option 4: Secure files | Medium-High | Low | No | No |

## Recommendations

- **For development/testing**: Option 1 (file-based) - quickest to set up
- **For production**: Option 2 (re-import) - most secure with Keychain
- **For portability**: Option 3 (P12 files) - easy to move between systems
- **For existing file-based users**: Option 4 (secure files) - improve security of current setup

## See Also

- [Certificate Access Prompting](./Certificate_Access_Prompting.md) - Configure user prompts for Keychain access
- [Using Team Configuration](./Using%20Team%20Configuration.md) - Profile configuration guide
- macOS `security` command: `man security`
- OpenSSL documentation: `man openssl-pkcs12`

## Support

If you continue to experience issues after trying these workarounds:

1. Check that certificate and key files are valid PEM format
2. Verify file permissions are restrictive (`600` for keys)
3. Test authentication manually with `curl`:
   ```bash
   curl --cert my-cert.pem --key my-key.pem https://your-host:443
   ```
4. Enable debug logging in Zowe CLI to see detailed error messages
