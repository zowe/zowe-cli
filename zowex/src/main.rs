/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

use std::env;
use std::io;

// other source modules that constitute this executable
mod comm;
mod defs;
mod proc;
mod run;
mod util;

#[cfg(test)]
mod test;

// Modules that we actually reference
use run::*;

extern crate tokio;

// TODO(Kelosky): performance tests, `time for i in {1..10}; do zowe -h >/dev/null; done`
// 0.8225 zowex vs 1.6961 zowe average over 10 run sample = .8736 sec faster on linux

// PS C:\Users\...\Desktop> 1..10 | ForEach-Object {
//     >>     Measure-Command {
//     >>         zowex -h
//     >>     }
//     >> } | Measure-Object -Property TotalSeconds -Average
// 3.6393932 and 0.76156812 zowe average over 10 run sample = 2.87782508 sec faster on windows

#[tokio::main]
async fn main() -> io::Result<()> {
    // turn args into vector
    let mut cmd_line_args: Vec<String> = env::args().collect();

    cmd_line_args.drain(..1); // remove first (exe name)

    /* Run the desired command.
     * The Ok branch represents when we successfully run a command, and that
     * command succeeds, or the command fails and "successfully" returns a
     * failure exit code. Alternatively, our Err branch represents when we
     * fail to run the command.
     */
    let exit_code: i32 = match run_zowe_command(&mut cmd_line_args).await {
        Ok(ok_val) => ok_val,
        Err(err_val) => err_val,
    };

    /* Rust does not enable main() to return an exit code.
     * Thus, we explicitly exit the process with our desired exit code.
     */
    std::process::exit(exit_code);
}
