# Certificate Access Prompting

## Overview

Zowe CLI can be configured to prompt users for explicit authorization before accessing certificates from the system keychain (macOS Keychain, Windows Credential Vault, or Linux Secret Service). This provides an additional layer of security and transparency when using certificate-based authentication.

## Configuration

### Option 1: Using imperative.json (For CLI Extensions/Plugins)

If you're developing a CLI extension or plugin, you can configure prompting in your `imperative.json`:

```json
{
  "credentialManagerOptions": {
    "promptForCertAccess": true
  }
}
```

### Option 2: Programmatic Configuration (For SDK Users)

If you're using Zowe Imperative SDK programmatically:

```typescript
import { CredentialManagerFactory } from "@zowe/imperative";

await CredentialManagerFactory.initialize({
  service: "MyApp",
  promptForCertAccess: true
});
```

## User Experience

When `promptForCertAccess` is enabled:

1. **First Access**: When Zowe CLI needs to access a certificate or private key from the keychain, the user will see a prompt:
   ```
   Zowe CLI would like to access certificate 'User BJSIMM on tvt4002' from your system keychain. Allow? [y/N]:
   ```

2. **User Response**:
   - Type `y` and press Enter to allow access
   - Type `n` (or any other key) to deny access
   - The CLI will wait up to 60 seconds for a response

3. **Subsequent Access**: The prompt is shown only once per certificate account name during the same session. If denied, the CLI will try alternative authentication methods.

## Behavior

### Async Code Path (Recommended)

When using async APIs (most common), the prompt will appear before certificate access:

- Certificate retrieval is delayed until user responds
- User can deny access and CLI falls back to other auth methods

### Sync Code Path (Legacy)

When using synchronous APIs:

- Prompting is **not available** (prompts are inherently async)
- A warning is logged indicating prompting was requested but skipped
- Certificate access proceeds without prompting

**Recommendation**: Use async APIs (`addPropsOrPrompt`, `addCredsToSessionAsync`) for full prompting support.

## Security Considerations

### Benefits of Prompting

- **Explicit Consent**: Users explicitly authorize each certificate access
- **Transparency**: Users know exactly when their certificates are being accessed
- **Audit Trail**: All prompts and responses are logged for review

### Limitations

- Prompting adds friction to the user experience
- Not suitable for automated/headless environments (will timeout after 60 seconds)
- Sync API paths cannot prompt (logs warning instead)

### Best Practices

1. **Enable for Interactive Use**: Use prompting when users run CLI commands interactively
2. **Disable for Automation**: Set `promptForCertAccess: false` (or omit) for CI/CD pipelines and scripts
3. **Document Behavior**: Inform users that they'll be prompted for certificate access
4. **Session Caching**: Prompts are shown once per session per account, reducing repeated interruptions

## Example: Profile with Certificate Account

Profile configuration (`~/.zowe/zowe.config.json`):

```json
{
  "profiles": {
    "tvt": {
      "type": "zosmf",
      "properties": {
        "host": "example.com",
        "port": 443,
        "rejectUnauthorized": true,
        "certAccount": "CertificateName",
        "authOrder": ["cert-pem"]
      }
    }
  }
}
```

With `promptForCertAccess: true`, running a command like:

```bash
zowe zos-files list ds HLQ --zosmf-profile tvt
```

Certain OSs with the setting can produce:

```
Zowe CLI would like to access certificate 'CertificateName' from your system keychain. Allow? [y/N]: y
Zowe CLI would like to access private key 'CertificateKeyName' from your system keychain. Allow? [y/N]: y
```

After authorization, the command proceeds with certificate-based authentication.

## Troubleshooting

### Prompt Doesn't Appear

- **Check Configuration**: Verify `promptForCertAccess: true` is set
- **Check API Path**: Ensure you're using async APIs (not sync variants)
- **Check Terminal**: Prompts require an interactive terminal (stdin/stdout)

### Timeout Errors

- **User Didn't Respond**: Default timeout is 60 seconds
- **Headless Environment**: Disable prompting in CI/CD environments
- **Background Process**: Prompts won't work in background processes

### Access Denied

- **User Selected 'N'**: CLI falls back to next auth method in authOrder
- **No Fallback Available**: Command fails with authentication error
- **Retry**: Run command again and select 'y' when prompted

## Backward Compatibility

The `promptForCertAccess` option is **disabled by default** for backward compatibility:

- Existing configurations continue to work without modification
- No breaking changes to existing workflows
- Opt-in feature for enhanced security

To maintain backward compatibility:

- Default: `promptForCertAccess: false` (no prompting)
- Explicit opt-in: `promptForCertAccess: true` (enable prompting)
