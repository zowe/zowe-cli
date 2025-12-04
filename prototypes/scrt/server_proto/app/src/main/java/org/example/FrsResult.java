/*************************************************************************************************
 * Fake FRS classes to enable this prototype to compile before integrating into the REST API SDK.
*************************************************************************************************/
// Todo: Remove the following fake class and use the real class when integrating into the REST SDK API

package org.example;

public class FrsResult {
    private int rc = 0;
    private int rsn = 0;

    public FrsResult(int rc, int rsn,  byte[] token) {
        this.rc = rc;
        this.rsn = rsn;
    }
    public int getRc() {
        return this.rc;
    }
    public int getRsn() {
        return this.rsn;
    }
    public byte[] getToken() {
        return "Token from FrsResult".getBytes();
    }
}
