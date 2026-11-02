if (-not $env:JAVA_HOME) {
    if (Test-Path "D:\jdk21\bin\java.exe") {
        $env:JAVA_HOME = "D:\jdk21"
    } elseif (Test-Path "C:\Program Files\Java\latest\jdk-21\bin\java.exe") {
        $env:JAVA_HOME = "C:\Program Files\Java\latest\jdk-21"
    }
}

$javaExe = "$env:JAVA_HOME\bin\java.exe"
if (-not (Test-Path $javaExe)) {
    Write-Error "JAVA_HOME is not set or java.exe was not found. Please ensure JDK 21 is installed."
    exit 1
}

$baseDir = $PSScriptRoot
if (Test-Path "D:\QuanLyDatSanCauLong\backend\.mvn\wrapper\maven-wrapper.jar") {
    $baseDir = "D:\QuanLyDatSanCauLong\backend"
}

$wrapperJar = Join-Path $baseDir ".mvn\wrapper\maven-wrapper.jar"
if (-not (Test-Path $wrapperJar)) {
    Write-Error "Could not find maven-wrapper.jar at $wrapperJar"
    exit 1
}

$prevDir = Get-Location
try {
    Set-Location $baseDir
    & $javaExe -classpath $wrapperJar "-Dmaven.multiModuleProjectDirectory=$baseDir" org.apache.maven.wrapper.MavenWrapperMain @args
} finally {
    Set-Location $prevDir
}
