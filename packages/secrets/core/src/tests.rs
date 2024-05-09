#[cfg(test)]
mod tests {
    use crate::os::*;

    const CREDENTIALS: [(&str, &str); 5] = [
        ("TestASCII", "ASCII string"),
        ("TestUTF8", "ᚻᛖ ᚳᚹᚫᚦ ᚦᚫᛏ ᚻᛖ ᛒᚢᛞᛖ ᚩᚾ ᚦᚫᛗ ᛚᚪᚾᛞᛖ ᚾᚩᚱᚦᚹᛖᚪᚱᛞᚢᛗ ᚹᛁᚦ ᚦᚪ ᚹᛖᛥᚫ"),
        ("TestCharSet", "I 💔 ASCII"),
        ("TestUTF16", "🌞🌙🌟🌴"),
        ("TestCJK", "「こんにちは世界」"),
    ];
    const SERVICE: &str = "TestKeyring";

    #[test]
    fn test_get_and_set() {
        let service = SERVICE.to_owned();
        CREDENTIALS.iter().for_each(|cred| {
            let acc = cred.0.to_string();
            let pw = cred.1.to_string();
            set_password(&service, &acc, &pw).unwrap(); 
            assert_eq!(get_password(&service, &acc).unwrap_or(Some("".to_owned())), Some(pw));
        });
    }

    #[test]
    fn test_query() {
        let service = SERVICE.to_owned();
        let mut creds: Vec<(String, String)> = vec![];
        let _res = find_credentials(&service, &mut creds);
        assert_eq!(creds.len(), CREDENTIALS.len());
        for cred in creds.iter() {
            assert_eq!(CREDENTIALS.contains(&(cred.0.as_ref(), cred.1.as_ref())), true);
        }
    }

    #[test]
    fn test_remove_creds() {
        let service = SERVICE.to_owned();
        CREDENTIALS.iter().for_each(|cred| {
            let acc = cred.0.to_string();
            delete_password(&service, &acc).unwrap();
            assert_eq!(get_password(&service, &acc).unwrap(), None);
        });
    }
}