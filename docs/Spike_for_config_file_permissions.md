# Spike: file permissions for Zowe client configuration files

| Item | Value |
| --- | --- |
| Status | Rough draft. Not reviewed. |
| Author | Trae Yelovich |
| Date | 2026-08-21 |
| Branch | `spike/bc-cfg-perms-n-prebuild-check` |
| Source | Security scan report on `ConfigLayers.write`, `Config.setSchema`, and `prebuildCheck.js` |
| Code base | `master` at commit `963dbaa81` (version 8.36.0) |

## Terms

This document uses these technical names:

* **Layer** - one of the four Zowe configuration files. The four layers are the
  global team layer, the global user layer, the project team layer, and the
  project user layer.
* **Global layer** - a configuration file in the Zowe home directory
  (`~/.zowe` by default).
* **Project layer** - a configuration file in a work directory or a repository.
* **User layer** - a file whose name ends with `.user.json`. One person owns this
  file. Teams do not share this file.
* **Team layer** - a file whose name is `zowe.config.json`. Teams share this file.
* **Vault** - the operating system credential store. The Secrets SDK reads and
  writes the vault.
* **`secure` array** - an array in a layer that lists the properties that are kept in the vault.
* **Secure property** - a property that the profile schema marks with
  `secure: true`. Examples are `user`, `password`, and `tokenValue`.
* **Plain text credential** - a credential property whose value is directly contained within a configuration file, because the `secure` array does not list that property.
* **Mode** - the POSIX permission bits of a file or a directory.
* **umask** - a command / system setting in Unix-like operating systems that defines the default permissions for new directories and files (*"user file mode creation mask"*).

---

## 1. Problem statement and validation

The report makes four claims:

1. Imperative/Zowe SDK writes every configuration layer with no `mode` argument. The mode
   becomes `0666` minus the process umask. On most computers the result is
   `0644`.
2. Imperative/Zowe SDK creates `~/.zowe` with no `mode` argument. The mode becomes `0777`
   minus the umask. On most computers the result is `0755`.
3. No code on the write path for configuration files calls `chmod` or
   `IO.giveAccessOnlyToOwner`. The daemon process identifier file gets mode
   `0600`, so the code base is not consistent.
4. `prebuildCheck.js` exits with code 0 for a load error that is not
   `MODULE_NOT_FOUND`. An install therefore succeeds with a keyring module that
   cannot load. The failure appears later, at run time.

### What the code shows

Every claim in the report is correct. The table below gives the evidence.

<details>
<summary>Evidence table (click to expand)</summary>

| Claim | Evidence in the code base |
| --- | --- |
| No mode on the layer write | `packages/imperative/src/config/src/api/ConfigLayers.ts:94` - `fs.writeFileSync(layer.path, ...)` with two arguments. Node.js uses mode `0666` by default. |
| No mode on the schema write | `packages/imperative/src/config/src/Config.ts:588` - the same pattern. |
| No mode on the directory | `packages/imperative/src/io/src/IO.ts:117-120` - `IO.createDirSync` calls `fs.mkdirSync(dir, {recursive: true})`. Node.js uses mode `0777` by default. |
| `~/.zowe` comes from that helper | `packages/imperative/src/settings/src/AppSettings.ts:52` calls `IO.createDirsSyncFromFilePath` for `~/.zowe/settings/imperative.json`. |
| No `chmod` on the config path | A search for `chmod`, `giveAccessOnlyToOwner`, and octal modes returns no hit under `packages/imperative/src/config/`. |
| The daemon is stricter | `packages/cli/src/daemon/DaemonDecider.ts:174-177` - mode `0600` and then `IO.giveAccessOnlyToOwner`. `packages/cli/src/daemon/DaemonUtil.ts:41` restricts the daemon directory. |
| Other code is stricter | `packages/imperative/src/events/src/EventUtils.ts:119` uses mode `0750` for a directory. Line 135 uses mode `0640` for a file. |
| The tools already exist | `IO.giveAccessOnlyToOwner` at `IO.ts:347` and `IO.hasOwnerOnlyAccess` at `IO.ts:395`. Version 8.35.0 added the second function. |
| The prebuild check exits 0 | `packages/secrets/scripts/prebuildCheck.js:16-21` - the `else` branch calls `console.error` and does not throw. |
| The exit code controls the rebuild | `packages/secrets/package.json:42` - `"install": "node scripts/prebuildCheck.js \|\| npm run rebuild"`. Exit code 0 stops the rebuild. |
| Linux needs a system library | `packages/secrets/core/Cargo.toml` - the Linux and FreeBSD targets depend on `libsecret` and `libsecret-sys`. A computer with no `libsecret` runtime library gives `ERR_DLOPEN_FAILED`. |

</details>

The report also says that Zowe CLI/SDKs never write a plain text credential on their own. The code confirms this statement. `ConfigSecure.cacheAndPrune` at
`packages/imperative/src/config/src/api/ConfigSecure.ts:155-193` removes every
property that the `secure` array lists from the text that `ConfigLayers.write`
writes. A broken vault causes a **loss of the value**. A broken vault does not cause a plain text write.

### 1.3 Corrections to the report

Four parts of the report need a correction. Two corrections make the problem smaller. One correction makes the problem larger.

**Correction 1. The schema file is not part of the problem.**

The report lists `Config.ts:588` as a vulnerable write. That write creates
`zowe.schema.json`. A schema file holds property names and descriptions. A
schema file holds no credential, so a stricter mode gives no security value. Teams also commit the schema file and share it, which is the opposite of what a stricter mode permits. Only one case can break: a tool that reads the schema under a different account, such as a language server in a development container. That case is rare, but there is no benefit to weigh against it. We must remove this file from the scope of the fix.

**Correction 2. The mode is the second line of defense, not the first.**

The report states that the credentials become readable by every local account.
This result needs two conditions at the same time:

1. A plain text credential is in the file.
2. The home directory of the owner permits traversal by other accounts.

The live test in the report shows this point. On the test computer the mode of
the file was `664`, but the home directory was `0750`, and the cross-account read
failed. A modern Linux distribution and z/OS both use a home directory that
blocks the read. So the mode of the configuration file is a second control. It
is still worth a fix, because a second control must hold when the first control
fails. Examples of a first control that fails are an administrator who creates a
home directory with mode `0755`, a backup archive, a container image layer, and
a web server document root.

**Correction 3. The plain text store is not a workaround. It is the only option
on z/OS USS.**

The report calls the plain text store a documented workaround for a broken
keyring on Linux. The code base shows a stronger fact.

* `packages/secrets/src/keyring/napi.json` lists the build targets. The list has
  no z/OS target. Secrets SDK for Zowe has no keyring binary for z/OS USS.
* `docs/Design_for_securing_CLI_properties_with_NodeJS_Crypto.md:27` says:
  "Because no Keytar binary is available for USS, customers must currently store
  credentials in plain text."
* `packages/imperative/CHANGELOG.md:1152` records a change that lets
  `ConfigAutoStore` write a plain text value for a property that the schema marks
  as secure. Zowe Explorer asked for that change.
* `packages/imperative/src/imperative/src/config/cmd/set/set.handler.ts:41-43`
  refuses `zowe config set --secure true` when the vault fails. So
  `--secure false` is the only route that remains.

z/OS USS is a multi-user platform by design. Many people share one z/OS system.
The default umask on z/OS USS is often `022`. So the strongest case for this
problem is not a headless Linux computer. The strongest case is Zowe CLI on
z/OS USS, where a plain text credential is normal and where other people share
the same file system.

**Correction 4. A non-zero exit code does not repair the keyring.**

The report implies that a strict exit code in `prebuildCheck.js` fixes the
silent failure. It does not. When `libsecret` is absent at run time, a local
build also fails, because the build needs the `libsecret` development headers.
A strict exit code turns a silent run time failure into a failed installation.
The prebuild check needs a better message. The exit code is a separate decision.
Section 4.4 covers this decision.

### 1.4 Conclusion of the validation

The finding is valid. This is an incorrect default permission problem
(CWE-276). We must fix it for a few reasons:

1. The files can hold live z/OS credentials. Zowe CLI supports that configuration,
   and z/OS USS gives no other option.
2. The code base is no longer consistent. Zowe CLI already protects the daemon socket, the daemon process identifier file, the event files, and a temporary file in the
   `zosfiles` package. The file that holds the credentials gets no protection.
3. The two helper functions that we need already exist and already have tests.
   The change is small.

**The spike continues...**

---

## 2. Threat model

The table below lists the accounts that can read a configuration file, based on platform.

| Platform | Home directory mode | Result with a file at `0644` |
| --- | --- | --- |
| z/OS USS | Often `0755`, set by the security administrator | Every user with a TSO or USS account can read the file |
| Debian 11 and earlier | `0755` | Every local account can read the file |
| Ubuntu 20.04 and earlier | `0755` | Every local account can read the file |
| Red Hat Enterprise Linux 8 and later | `0700` | Only the owner and `root` can read the file |
| Debian 12, recent Ubuntu | `0750` | The owner and the primary group of the owner |
| macOS | `0700` for a user home directory | Only the owner and `root` |
| Windows | An access control list, not a mode | Only the owner and an administrator |
| A shared project directory on NFS | Set by the site | Often the whole group |
| A container image or a backup archive | The mode travels with the file | Anybody who reads the image or the archive |

Three more paths exist that a home directory mode does not block:

* A backup tool that runs as another account copies the file with the mode.
* A build agent that packs a work directory into an artifact copies the file.
* A project directory that a web server serves copies the file to a browser.

---

## 3. Proposed behavior

### 3.1 Options that I compared

**Option A. Owner only for every layer and the schema.**
Set mode `0600` on all four layers and on the schema file. Set mode `0700` on
`~/.zowe`. Also set the mode of a file that already exists.

* Strength: it closes every case.
* Weakness: it breaks a shared project directory, a shared container image, and
  a build agent that runs as a second account. It also breaks a site that shares
  a global configuration file through a group. We reject this option.

**Option B. Mode by layer, as the triage comment suggests.**
Set mode `0600` on the global layers and mode `0660` on the project layers. Set
mode `0700` on `~/.zowe`.

* Strength: it is one simple rule. A person can predict the mode from the path.
* Weakness: mode `0660` still lets the whole group read a plain text password.
  The value of `0660` depends fully on the group membership at the site. Mode
  `0660` on a project team file also breaks a build agent whose group does not
  match.

**Option C. Mode by layer, plus a warning by content. Recommended.**
Set a strict mode on the three layers that one person owns. Leave the shared
layer alone. Warn when a shared layer holds a plain text credential.

We select Option C. It closes the credential problem in every layer, and it
changes the mode of only the files that one person owns.

### 3.2 The rule set for Option C

| Layer | Path | Mode for a new file | Reason |
| --- | --- | --- | --- |
| Global team | `~/.zowe/zowe.config.json` | `0600` | The file is in a private home directory. |
| Global user | `~/.zowe/zowe.config.user.json` | `0600` | One person owns the file. |
| Project user | `./zowe.config.user.json` | `0600` | One person owns the file. Git ignores the file. |
| Project team | `./zowe.config.json` | No change | Teams share the file through source control. |
| Schema | `zowe.schema.json` | No change | The file holds no credential. |
| Zowe home directory | `~/.zowe` | `0700` when Zowe creates it | The directory is private to one person. |

The rule for the project team layer needs one addition. When that layer holds a
plain text credential, Zowe clients show a warning and names the file. This leaves it up to the person to change the `mode`.

### 3.3 A new file compared to a file that already exists

A question was raised in the refinement comments: "Permission change when first created vs existing? Research needed." 

The answer comes from the Node.js API. `fs.writeFileSync` passes the `mode` value to `open()`. `open()` applies the mode only when it creates the file. For a file that already exists, `open()` ignores the mode. `fs.mkdirSync` behaves the same way for a directory.

So a `mode` argument alone changes nothing for the people who use Zowe clients today.
Every configuration file that exists now keeps mode `0644`.

I propose these new behaviors and additions:

* **For a new file:** Zowe CLI/SDKs create the file with the mode from the table in
  section 3.2. There is no window with a weak mode, because `open()` sets the
  mode at the moment of creation.
* **For a file that already exists:** Zowe CLI/SDKs do not change the mode during a normal
  write. Two reasons support this choice. First, a person can set a mode on
  purpose, and we cannot fight that choice on every command. Second, a
  silent change of a mode is hard to debug.
* **For file that already exists and holds a plain text credential:** Zowe clients show a warning that names the file, the mode, and a command/options to fix the mode.
* **Add a CLI command that fixes the mode:** A new command, `zowe config restrict-access`,
  sets the mode on the layers that the person selects. The command supports
  `--global`, `--user`, and `--dry-run`.

### 3.4 Windows

POSIX mode bits have no meaning on Windows. Node.js maps only the read-only
bit. `IO.giveAccessOnlyToOwner` therefore runs the `icacls` program.

I propose no change to the access control list on Windows, for three reasons:

1. A Windows user profile directory already denies read access to other
   non-administrator accounts.
2. `icacls` is a separate process. `Config.save()` can write up to four layers.
   That gives up to four process starts per command. In daemon mode the cost
   repeats for every command.
3. `icacls /inheritancelevel:r` removes inheritance. That is a large change for a
   file in a repository that other tools read.

On Windows, `zowe config report-env` reports the state of the access control
list with `IO.hasOwnerOnlyAccess`. The proposed `zowe config restrict-access` command
also works on Windows for the person who wants the change.

### 3.5 An escape hatch for a site

A site may need a way to select a different mode. I propose an environment
variable that follows the pattern in
`packages/imperative/src/imperative/src/env/EnvironmentalVariableSettings.ts`.

* Name: `ZOWE_CONFIG_FILE_MODE`.
* Value: an octal string, for example `0640`.
* The value `0` means: do not set a mode. Zowe CLI/SDK uses the umask, as it does today.
* Apply the value only to a new file, and only on a POSIX platform.

---

## 4. Breaking changes

### 4.1 The mode of a new global configuration file changes

Today `zowe config init --global-config` creates `~/.zowe/zowe.config.json` with
mode `0644`. After the change the mode is `0600`.

Who breaks: a site that lets a second account read the global configuration file
of a first account. A build image that creates the file as `root` and then runs
Zowe as an unprivileged account breaks.

### 4.2 The mode of the Zowe home directory changes

Today Zowe creates `~/.zowe` with mode `0755`. After the change the mode is
`0700`.

Who breaks: the same group as section 4.1. A directory at mode `0700` also
blocks a second account from reading `~/.zowe/logs`. A support process that
collects a log file from another account breaks.

Note: this change applies only when Zowe creates the directory. A directory that
exists keeps its mode.

### 4.3 The mode of a new project user configuration file changes

Today `zowe config init --user-config` creates `./zowe.config.user.json` with
mode `0644`. After the change the mode is `0600`.

Who breaks: a build agent that runs the `init` command as one account and the
later commands as a second account.

### 4.4 The message from the Secrets SDK install changes

Today an install prints one line from `console.error` when the keyring module
cannot load. After the change the install prints a block of text. The block
names the reason, the effect on the commands, and the repair steps.

The exit code stays 0. We should not make the install fail, for the reason mentioned in
correction 4 of section 1.3. A failed install helps nobody on a computer where
the build also fails.

**Open decision.** A second option exists. `prebuildCheck.js` could exit with a
non-zero code for a `MODULE_NOT_FOUND` error only, as it does today, and could
write a marker file for every other error. The marker file lets
`zowe config report-env` report the problem without a load attempt. This option
adds a file to the Zowe home directory. Section 9 lists this decision as an open
question.

### 4.5 What does not break

* No public API signature changes. The new `mode` parameter on
  `IO.createDirSync` is optional.
* No file format changes.
* No behavior changes for a configuration file that exists today, until the
  person runs `zowe config restrict-access`.
* No behavior changes on Windows, except one more report line.

---

## 5. Who is affected

| Group                                                            | Effect                                                                                                                                              | Size of the effect           |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| A person who runs Zowe CLI on one computer                       | The mode of a new file gets stronger. Nothing else changes.                                                                                         | None                         |
| A person who runs Zowe CLI on z/OS USS                           | The plain text credential in a new file stops being readable by other accounts on the system. This group gets the largest benefit.                  | Large benefit                |
| A team that shares a project team configuration file through Git | No change. Git does not track a mode, except the execute bit.                                                                                       | None                         |
| A site that shares `~/.zowe` between accounts                    | The share breaks for a new file and a new directory. The site must move to a supported method.                                                      | Large. Needs documentation.  |
| A container image that creates the configuration as `root`       | The image breaks when the container runs Zowe as a second account.                                                                                  | Medium. Needs documentation. |
| Zowe Explorer for VS Code                                        | Zowe Explorer calls the same `Config` API. It gets the same behavior. The file watcher does not break, because the write does not change the inode. | Small                        |
| An extender that calls `Config.save()`                           | The extender gets the new mode. No code change is needed.                                                                                           | None                         |
| A site with a broken keyring on Linux                            | The install message becomes clear. The problem itself does not change.                                                                              | Small benefit                |
| A support team that collects a log file from `~/.zowe/logs`      | The collection breaks for a home directory that Zowe creates after the change.                                                                      | Medium                       |

---

## 6. What this solves

1. A new global configuration file and a new project user configuration file
   stop being readable by other local accounts on a POSIX computer.
2. A new Zowe home directory stops being readable by other local accounts. This
   also protects `~/.zowe/logs` and `~/.zowe/extenders.json`.
3. The code base becomes consistent. The file that holds the credentials gets
   the same care as the daemon socket and the daemon process identifier file.
4. A person who holds a plain text credential in a shared project file gets a
   warning. The person can act.
5. `zowe config report-env` reports the mode of every layer. A support engineer
   can see the problem in a report.
6. A person whose keyring cannot load gets a clear message at install time, and
   a clear message from `zowe config report-env`.
7. The CWE-276 scan finding closes for the default configuration.

---

## 7. What this does not solve

1. **A file that already exists.** Every configuration file on disk today keeps
   mode `0644` until the person runs `zowe config restrict-access`. This is a
   choice, not a limit. Section 3.3 gives the reason.
2. **The plain text credential itself.** A password in a file is still a
   password in a file. A mode of `0600` protects the password from a second
   local account. It does not protect the password from a process that runs as
   the same account, from `root`, or from a backup archive.
3. **The missing keyring on z/OS USS.** Zowe clients still have no vault for USS. The
   only fix is a keyring for USS, or the design in
   `docs/Design_for_securing_CLI_properties_with_NodeJS_Crypto.md`. That work is
   much larger than this spike.
4. **Windows access control lists.** Section 3.4 gives the reason.
5. **The log files.** `~/.zowe/logs/zowe.log` and
   `~/.zowe/logs/imperative.log` get their mode from `log4js` and the umask. A
   new `~/.zowe` at mode `0700` protects them. An old `~/.zowe` does not. A
   separate work item must set a mode on the log files.
6. **A git repository that holds a plain text credential.** A mode does not stop
   a `git commit`. A separate work item could add a warning, or a `pre-commit`
   sample.
7. **The project team layer.** Option C leaves that file at the umask default,
   because teams share it. The warning is the only control there.
8. **A file on a file system with no mode support.** Examples are FAT32, a
   Windows network share, and some container volume drivers. The `mode`
   argument has no effect there.
9. **The `~/.zowe/settings/imperative.json` file and the plugin files.** These files
   do not hold credentials. A new `~/.zowe` at mode `0700` protects them anyway.

---

## 8. How a site can still share a configuration file

The triage comment asks for a documented way to share a configuration file at
the global level. Four supported methods exist today. None of them needs a weak
file mode.

**Method 1. The `ZOWE_CLI_HOME` environment variable.**
Set `ZOWE_CLI_HOME` to a shared directory. The site sets the mode of that
directory and the mode of the files in it. Zowe reads the layer from that
directory. The site controls the group, and the site accepts the risk. Zowe does
not create the directory, so Zowe does not set the mode.

```sh
export ZOWE_CLI_HOME=/opt/zowe/shared
zowe config list
```

**Method 2. The `zowe config import` command.**
Put the team configuration file on a web server or a file share. Each person
runs one command. Each person gets a private copy with a private mode.

```sh
zowe config import https://config.example.com/zowe.config.json --global-config
```

This method is the best one for most sites. Each person holds a private copy, so
the credentials of one person never reach a second person.

**Method 3. A project team layer in source control.**
Commit `zowe.config.json` to the repository. Never commit
`zowe.config.user.json`. Option C does not change the mode of the project team
layer, so this method continues to work with no change.

**Method 4. A group directory outside the Zowe home directory.**
Point the `$schema` property and the project layer at a group directory that the
site creates and controls. Section 3.5 also lets a site set
`ZOWE_CONFIG_FILE_MODE=0640` for a group that shares a file on purpose.

The documentation must add one rule for all four methods: **a shared
configuration file must not hold a credential.** Put the connection properties
in the shared file. Let each person supply the credentials from the vault, or
from the private user layer.

---

## 9. Open questions

| Number | Question | Preferred answer for now |
| --- | --- | --- |
| 1 | Do we change the mode of a file that already exists during a normal write? | No. Warn, and add `zowe config restrict-access`. |
| 2 | Do we change the Windows access control list by default? | No. Report only. |
| 3 | What mode do we use for the project team layer? | No change. Warn on a plain text credential. |
| 4 | Do we make the Secrets SDK install fail when the keyring cannot load? | No. Print a clear block of text. |
| 5 | How does Zowe find a plain text credential without the profile schema? | Use the schema from `ImperativeConfig.instance.loadedConfig` first. Fall back to a short list of property names. The list needs review. |
| 6 | Does the warning need a rate limit? A script that calls `Config.save()` in a loop prints the warning many times. | Print the warning one time per process. |
| 7 | Do we set a mode on the log files in the same work item? | No. A separate work item. |
| 8 | Does `zowe config restrict-access` need to run inside `zowe config init`? | No. A person must ask for a change to a file that exists. |
| 9 | Does Zowe Explorer need a matching change in its own file writes? | Unknown. Ask the Zowe Explorer squad. |
| 10 | Does the atomic write in section 10.6 belong in this work item? | No. It is a separate bug fix with its own value. |
| 11 | Do we accept the file creation in section 10.2, or do we prefer `writeFileSync` with a `mode` option and the test changes in section 10.3? | Accept the file creation. It changes no existing test. |

---

## 10. Proof of concept

The proof of concept is on this branch. Read the diff for the code. This section
records only the decisions that the code cannot show by itself.

### 10.1 What the branch changes

| File | Change |
| --- | --- |
| `packages/imperative/src/io/src/IO.ts` | Added the `OWNER_ONLY_FILE_MODE` and `OWNER_ONLY_DIR_MODE` constants. Added an optional `mode` parameter to `createDirSync` and `createDirsSyncFromFilePath`. |
| `packages/imperative/src/config/src/api/ConfigLayers.ts` | Added `modeForNewFile` and `warnOnLoosePermissions`. `write` now creates a new personal layer with owner-only permissions, and warns about a file that already exists. |
| `packages/imperative/src/config/src/ConfigUtils.ts` | Added `getConfigFileModeFromEnv` and `hasPlaintextSecret`, plus the `LIKELY_SECRET_PROP_NAMES` fallback list. |
| `packages/imperative/src/imperative/src/env/EnvironmentalVariableSettings.ts` | Added the `CONFIG_FILE_MODE_SUFFIX` constant. |
| `packages/imperative/src/settings/src/AppSettings.ts` | Creates the CLI home directory with owner-only permissions on a first run. |
| `packages/imperative/src/imperative/src/config/cmd/report-env/EnvQuery.ts` | Reports a config file that holds a plain text credential and grants access to other accounts. |
| `packages/secrets/scripts/prebuildCheck.js` | Replaced the single-line message with a message that names the cause, the effect, and the repair steps. |

### 10.2 Why the mode goes on an explicit file creation, not on the write

The obvious way to set the mode is `fs.writeFileSync(path, text, { mode })`. The
branch does not do that. It creates the file first, then writes into it:

1. `fs.openSync(path, "w", mode)` creates the file with the correct mode.
2. `fs.writeFileSync(path, text)` puts the content into that file.

Three reasons support this choice:

* **The content is never exposed.** The file holds no content until after it has
  the correct mode.
* **The "new files only" rule becomes visible.** `writeFileSync` ignores `mode`
  for a file that already exists. That behavior is easy to miss, and it is the
  whole reason that a mode argument alone does not help anybody who has Zowe
  today. An explicit creation puts the rule in the code.
* **The write keeps its call shape.** See section 10.3.

A `chmod` after the write is the third option. The branch does not use it,
because it leaves a window in which the credential is in a file that other
accounts can read.

### 10.3 A finding: about 30 tests pin the shape of the write call

This is the largest practical cost of the change, and the reason for the
mechanism in section 10.2.

Three test suites assert on the exact arguments of `fs.writeFileSync`:

* `packages/imperative/src/imperative/__tests__/config/cmd/set/set.handler.unit.test.ts`
* `packages/imperative/src/imperative/__tests__/config/cmd/secure/secure.handler.unit.test.ts`
* `packages/imperative/src/imperative/__tests__/config/cmd/init/init.handler.unit.test.ts`

They use `expect(writeFileSyncSpy).toHaveBeenNthCalledWith(1, path, text)`. Jest
fails such an assertion when the call has a third argument, even when that
argument is `undefined`. A `{ mode }` argument therefore breaks about 30
assertions across those three files. The first attempt in this spike produced 43
test failures for exactly this reason.

Two more points come from the same investigation:

* The failures appear only on a POSIX platform. On Windows no mode applies, so
  the same tests pass. A change that passes on a Windows workstation can still
  break the Linux build.
* Any test that does not stub the file creation writes to a real disk on a POSIX
  platform. The three suites above now stub `fs.openSync` and `fs.closeSync` for
  that reason.

### 10.4 A finding: the directory mode belongs in `AppSettings`

The first draft created the Zowe home directory inside `ConfigLayers.write`. The
branch does not do this. `Config.save` never created a directory before, and
`AppSettings.initialize` is what creates the CLI home directory on a first run.
The mode belongs where the directory is created. This keeps `write` free of a new
side effect, and it also protects `~/.zowe/logs` and `~/.zowe/extenders.json`,
which `ConfigLayers` knows nothing about.

### 10.5 Tests on the branch

| Test file | Test |
| --- | --- |
| `IO.unit.test.ts` | `createDirSync` passes the `mode` value to `fs.mkdirSync`, and omits the option when no mode is given. |
| `Config.api.unit.test.ts` | A new project user layer, global team layer, and global user layer each get `OWNER_ONLY_FILE_MODE`. |
| `Config.api.unit.test.ts` | The project team layer gets no mode. |
| `Config.api.unit.test.ts` | No mode is applied on Windows. |
| `Config.api.unit.test.ts` | No mode is applied to a file that already exists. |
| `Config.api.unit.test.ts` | A site-selected mode from the environment is honored, and a value of `0` opts out. |
| `Config.api.unit.test.ts` | The warning appears one time only, names the mode and the repair command, and stays silent when the file is owner-only or holds no plain text credential. |
| `ConfigUtils.unit.test.ts` | `getConfigFileModeFromEnv` parses an octal value, returns `0` for an opt-out, and rejects a value that is not octal, a digit above 7, and a mode above `0777`. |
| `ConfigUtils.unit.test.ts` | `hasPlaintextSecret` uses the schema, walks nested profiles, falls back to the name list, and returns false for an empty layer. |

The tests mock `os.platform()` to select the platform. This is why
`ConfigLayers` calls `os.platform()` rather than reading `process.platform`, and
it matches `IO.giveAccessOnlyToOwner`.

Still needed: a system test that runs `zowe config init --global-config` in a
temporary home directory on a POSIX platform and checks the mode on disk.

### 10.6 Limits of this proof of concept

* **The branch needs a full test run.** The mechanism changed late, after the
  last complete run. Run the unit suites before the review.
* **No POSIX run has happened.** The POSIX branch is covered only by unit tests
  that mock `os.platform()`. A reviewer must run the suites on Linux, and must
  run the system test on Linux and on z/OS USS. A Windows workstation cannot
  answer this question, and code that fakes the platform inside the product does
  not answer it either.
* **The name list in `hasPlaintextSecret` is a first guess.** See open question 5.
* **`zowe config restrict-access` does not exist yet.** The warning therefore
  tells the person to run `zowe config secure` or `chmod`. Work item 2 in
  section 11.2 adds the command, and the warning text must change with it.
* **The write is still not atomic.** `fs.writeFileSync` truncates the file
  before it writes, so a crash during a write destroys the configuration. A
  write to a temporary file, then a rename, fixes that. It is a separate work
  item. See open question 10.
* **One small race remains.** If another process deletes the file between the
  creation and the write, the write recreates it with the umask default. An
  account that can delete files in another person's home directory has stronger
  options than this race, so the branch does not handle it.

---

## 11. What is next

### 11.1 Actions to close this spike

1. Review this document with the squad. Confirm or change Option C in
   section 3.1.
2. Answer the eleven open questions in section 9.
3. Ask the Zowe Explorer squad about open question 9.
4. Ask the documentation squad to review section 8. That section becomes a new
   page about how to share a configuration file.
5. Run the unit suites on Linux, and write the system test in section 10.5. Run
   that test on Linux and on z/OS USS. Record the default umask and the default
   home directory mode on both platforms.

### 11.2 Work items after the spike

The change is small. The production code is about 90 lines across 7 files, and
the branch already holds it. Most of the remaining effort is a review and a test
run on a POSIX platform, not new code. Do not split the change into one work
item per file: the warning is useless without its helper functions, and the
`report-env` line is ten lines. Each row below is one pull request.

| Order | Work item | Size | State |
| --- | --- | --- | --- |
| 1 | The message from the prebuild check. | 1 | Code written |
| 2 | Owner-only creation for a new personal config file and for the CLI home directory. Includes the warning, the two `ConfigUtils` helper functions, the `report-env` line, and the tests. | 2 | Code written |
| 3 | The `zowe config restrict-access` command, with `--dry-run`. | 2 | No code |
| 4 | Documentation: how to share a configuration file. Section 8. | 1 | Text drafted in section 8 |

Total to close the scan finding: 6 points.

Notes on the sizes:

* Work item 1 has no design decision to settle, and it touches one file in one
  package. Merge it first, on its own. It does not wait for the review of the
  breaking change.
* Work item 2 is the breaking change. The code exists, so the two points cover
  the review, the POSIX test run, the changelog entries, and the review comments.
  One risk can make this larger: if the squad selects Option A or Option B in
  section 3.1 instead of Option C, the rule set in `modeForNewFile` changes.
* Work item 3 is a formulaic command in this code base: a definition file, a
  handler that calls `IO.giveAccessOnlyToOwner` for each selected layer, and
  unit tests. It does not close the scan finding, because the finding is about
  the default mode of a new file. It makes the warning in work item 2
  actionable. Until it exists, the warning names `chmod` instead.
* Work item 4 is mostly a move of section 8 into the Zowe documentation site.

These two work items are related, but they are not part of the finding. Size
them when somebody picks them up.

| Work item | Size | Note |
| --- | --- | --- |
| The mode of the log files. Section 7, item 5. | 1 | Needs a look at the log4js appender configuration first. |
| An atomic config write. Section 10.6. | 2 | Needs care with the rename on Windows, and with consumers that watch the inode. |

### 11.3 Release notes

Work item 1 is a breaking change, so it needs a `**Breaking**` entry in
`packages/imperative/CHANGELOG.md` and in `packages/cli/CHANGELOG.md`. A draft
of the entry follows.

> **Breaking**: Zowe now creates a new global configuration file, a new user
> configuration file, and a new Zowe home directory with owner-only permissions
> (`0600` and `0700`) on Linux, macOS, and z/OS USS. A file or a directory that
> already exists keeps its permissions. The project team configuration file
> (`zowe.config.json`) keeps the permissions that your umask gives it. Set
> `ZOWE_CONFIG_FILE_MODE` to select a different mode, or to `0` to keep the
> behavior of version 8.36.0 and earlier.

---

## References

| Subject | Location |
| --- | --- |
| The write for every layer | `packages/imperative/src/config/src/api/ConfigLayers.ts:82-99` |
| The write for the schema | `packages/imperative/src/config/src/Config.ts:573-590` |
| The prune of the secure values | `packages/imperative/src/config/src/api/ConfigSecure.ts:155-193` |
| The refusal of `--secure` when the vault fails | `packages/imperative/src/imperative/src/config/cmd/set/set.handler.ts:41-43` |
| The plain text store from the auto store | `packages/imperative/src/config/src/ConfigAutoStore.ts:198-200` |
| The creation of a directory | `packages/imperative/src/io/src/IO.ts:117-120` |
| The creation of `~/.zowe` | `packages/imperative/src/settings/src/AppSettings.ts:52` |
| `IO.giveAccessOnlyToOwner` | `packages/imperative/src/io/src/IO.ts:347-382` |
| `IO.hasOwnerOnlyAccess` | `packages/imperative/src/io/src/IO.ts:395-426` |
| The daemon process identifier file at `0600` | `packages/cli/src/daemon/DaemonDecider.ts:174-177` |
| The daemon directory | `packages/cli/src/daemon/DaemonUtil.ts:35-52` |
| The event files at `0750` and `0640` | `packages/imperative/src/events/src/EventUtils.ts:119,135` |
| The temporary file at `0600` in `zosfiles` | `packages/zosfiles/src/methods/copy/Copy.ts:309-311` |
| The prebuild check | `packages/secrets/scripts/prebuildCheck.js:14-22` |
| The install script | `packages/secrets/package.json:42` |
| The `libsecret` dependency | `packages/secrets/core/Cargo.toml` |
| The build targets, with no z/OS target | `packages/secrets/src/keyring/napi.json` |
| The statement about plain text on USS | `docs/Design_for_securing_CLI_properties_with_NodeJS_Crypto.md:27` |
| The change that permits a plain text secure property | `packages/imperative/CHANGELOG.md:1152` |
| The layer loop in `report-env` | `packages/imperative/src/imperative/src/config/cmd/report-env/EnvQuery.ts:262-277` |
| The environment variable pattern | `packages/imperative/src/imperative/src/env/EnvironmentalVariableSettings.ts` |

## Node.js behavior that this document depends on

| Function | Default mode | behavior for a path that exists |
| --- | --- | --- |
| `fs.writeFileSync(path, data)` | `0o666`, masked by the umask | Truncates the file. Keeps the mode of the file. |
| `fs.writeFileSync(path, data, { mode })` | The `mode` value, masked by the umask | Truncates the file. **Ignores `mode`.** |
| `fs.mkdirSync(path, { recursive: true })` | `0o777`, masked by the umask | Does nothing. Keeps the mode of the directory. |
| `fs.mkdirSync(path, { recursive: true, mode })` | The `mode` value, masked by the umask | Does nothing. **Ignores `mode`.** |
| `fs.chmodSync(path, mode)` | Not applicable | Sets the mode. The umask does not mask this value. |

A umask only removes permission bits. It never adds a bit. So a `mode` value of
`0o600` gives `0o600` for every normal umask value.

On Windows, Node.js maps only the read-only bit of a mode. Every other bit has
no effect.
