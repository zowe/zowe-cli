/*************************************************************************************************
 * VersionRegex class to enable this prototype to compile before integrating into the REST API SDK.
*************************************************************************************************/
// Todo: Remove the following class which was copied frm the REST API SDK, and use the real class.

package org.example;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import lombok.AllArgsConstructor;

/**
 * A class applying regex to ensure all possible SDK versions created will be
 * parsed to version, release and modification number integers
 */
@AllArgsConstructor
public class VersionRegex {

	private final String versionString;
	private static final Pattern FIRST_NUMBERS = Pattern.compile("^(\\d+)(\\D.*)?$");

	/**
	 * Parse the input string
	 *
	 * @return the first numbers in the string
	 */
	public int parse() {
		String stringToParse = versionString;
		if (versionString.equals("x")) {
			stringToParse = "0";
		}

		Matcher matcher = FIRST_NUMBERS.matcher(stringToParse);
		if (!matcher.matches()) {
			throw new IllegalArgumentException("Invalid input: " + stringToParse);
		}
		return Integer.parseInt(matcher.group(1));
	}
}
