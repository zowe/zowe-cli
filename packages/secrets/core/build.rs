fn main() {
    // Only compile Objective-C on macOS
    #[cfg(target_os = "macos")]
    {
        // Compile the Objective-C file
        cc::Build::new()
            .file("src/os/mac/nsurlsession_https.m")
            .flag("-fobjc-arc") // Enable ARC (Automatic Reference Counting)
            .compile("nsurlsession_https");
        
        // Link against Foundation and Security frameworks
        println!("cargo:rustc-link-lib=framework=Foundation");
        println!("cargo:rustc-link-lib=framework=Security");
        
        // Tell cargo to rerun if the Objective-C file changes
        println!("cargo:rerun-if-changed=src/os/mac/nsurlsession_https.m");
    }
}
