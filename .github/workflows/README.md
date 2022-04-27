# GitHub Workflows

General information about GH Workflows

### Using `act`

- Read it: https://github.com/nektos/act (Requires Docker)
- Install it https://github.com/nektos/act#installation
- Run it: `npm run test:act`
- Clean it: `npm run test:act -- --clean`

For more information, run: `npm run test:act -- --help`

**Known Issues for `nektos/act@0.2.24`**

`0.` The first time it will likely take ~3 minutes to run. Subsequent runs (with `--reuse`) should take less than 2 minutes. <br/>
`1.` Artifact upload and download doesn't work on `nektos/act` (hence why we need to copy the zowe.tgz to a shared Docker volume). <br/>
`2.` `nektos/act` only works with linux distros. <br/>
`3.` `Install Rust toolchain` step was replaced with simple `yum install cargo -y` because `actions-rs/toolchain@v1` doesn't really work with `nektos/act`. <br/>
`4.` Steps context (`steps.<id>`) doesn't really work on `nektos/act` (hence why we force unit and integration tests to run). <br/>
`5.` Pipeline cannot be stopped (`Ctrl+C`) during most steps unless you kill your docker daemon. <br/>
