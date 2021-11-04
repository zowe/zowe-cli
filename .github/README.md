# GitHub Workflows

General information about GH Workflows

### Using `act`

1. Read about it: https://github.com/nektos/act (Requires Docker)
2. Install it https://github.com/nektos/act#installation
3. Run: `act --eventpath .github/_act_event.json --workflows .github/workflows/zowe-cli.yml --verbose --reuse`
    - Equivalent: `act -vre .github/_act_event.json -W .github/workflows/zowe-cli.yml`
4. After it fails the first time, Copy the `zowe.tgz` file from the Build-Linux container to the Cross-Platform-Test container
    - `docker cp act-Zowe-CLI-Build-Linux:/root/gh/zowe/zowe-cli/zowe.tgz .`
    - `docker cp zowe.tgz act-Zowe-CLI-Cross-Platform-Test:/root/gh/zowe/zowe-cli/`
5. Run: `act -re .github/_act_event.json -W .github/workflows/zowe-cli.yml`

`100.` To start from scratch, just remove the containers
    - `docker rm act-Zowe-CLI-Build-Linux --force`
    - `docker rm act-Zowe-CLI-Cross-Platform-Test --force`

**Knwon Issues for `nektos/act@0.2.24`**

`0.` The first time (i.e. when it is supposed to fail) it will likely take ~3 minutes to run. Subsequent runs (with `--reuse`) should take less than 2 minutes. <br/>
`1.` Artifact upload and download doesn't work on `nektos/act` (hence why we need to manually copy the zowe.tgz). <br/>
`2.` `nektos/act` only works with linux distros. <br/>
`3.` `Install Rust toolchain` step was replaced with simple `yum install cargo -y` because `actions-rs/toolchain@v1` doesn't really work with `nektos/act`. <br/>
`4.` Steps context (`steps.<id>`) doesn't really work on `nektos/act` (hence why we force unit and integration tests to run). <br/>
`5.` Pipeline cannot be stopped (`Ctrl+C`) during most steps unless you kill your docker daemon. <br/>
