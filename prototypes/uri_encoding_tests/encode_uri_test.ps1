# test special characters in USS REST URI
pushd C:\your\laptop\test\dir

set-Alias zoweCmd zowe-v3

$fileStem = "/your/uss/dir/test"

$specChars = """\-=~,.!:'&$@*_% +?#;<>[]^{|}"

$loopCount = 0
foreach ($specialChar in [char[]]$specChars) {
    $fileName = "$fileStem${specialChar}XXX"
    cls
    $loopCount++
    if ($loopCount -eq 1) {
        echo "Version of Zowe"
        zoweCmd --version
    }    
    echo "`nSpecial character  '$specialChar'"
    echo "File = $fileName"

    foreach ($profileType in "z/OSMF", "API-ML") {
        $profParms = "--zosmf-profile "
        if ($profileType -eq "z/OSMF") {
            $profParms += "zosmf"
        } else {
            $profParms += "apiml"
        }
        $profParmsArray = $profParms -split ' '
        echo "`n_____________________________________________________ Connecting to $profileType`n"

        echo "--- Creating file ---"
        zoweCmd files create uss-file $fileName @profParmsArray
        echo ""
        if ($LASTEXITCODE -eq 0) {
            echo "--- Listing file ---"
            zoweCmd files list uss-files $fileName @profParmsArray

            echo "`n--- Uploading file ---"
            zoweCmd files upload file-to-uss .\hello_world_bpxbatch.jcl $fileName @profParmsArray

            echo "`n--- Downloading file ---"
            zoweCmd files download uss-file $fileName --file t:\download.txt @profParmsArray
            del t:\download.txt

            echo "`n--- Deleting file ---"
            zoweCmd files delete uss-file $fileName @profParmsArray --for-sure
        }
    }
    echo "`n_________________________________________________________________________"
    Read-Host "`nPress Enter to continue with the next special character"
}

echo "We are done testing with Zowe version:"
zoweCmd --version
popd
