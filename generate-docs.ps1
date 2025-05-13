# Generate Doxygen Documentation
# This script runs Doxygen to generate the documentation for the ImageProcessing project

Write-Host "Starting Doxygen documentation generation..." -ForegroundColor Green

# Check if Graphviz is installed and in PATH
$graphvizPath = "C:\Program Files\Graphviz\bin"
if (-not (Test-Path $graphvizPath)) {
    Write-Host "Warning: Graphviz path not found at $graphvizPath" -ForegroundColor Yellow
    Write-Host "Diagrams may not be generated correctly" -ForegroundColor Yellow
}
else {
    # Add Graphviz to PATH for this session
    $env:PATH += ";$graphvizPath"
    Write-Host "Added Graphviz to PATH" -ForegroundColor Green
}

# Ensure we have the docs directory
if (-not (Test-Path -Path "./docs/doxygen")) {
    New-Item -ItemType Directory -Path "./docs/doxygen" | Out-Null
    Write-Host "Created docs/doxygen directory." -ForegroundColor Green
}

try {
    # Run Doxygen
    Write-Host "Running Doxygen..." -ForegroundColor Green
    doxygen Doxyfile
    
    if ($LASTEXITCODE -eq 0 -or $null -eq $LASTEXITCODE) {
        Write-Host "Documentation generated successfully!" -ForegroundColor Green
        $indexPath = (Get-Item -Path ".\docs\doxygen\html\index.html").FullName
        Write-Host "Open the documentation at: $indexPath" -ForegroundColor Cyan
        
        # Open the documentation in the default browser
        Start-Process $indexPath
    }
    else {
        Write-Host "Error generating documentation. Exit code: $LASTEXITCODE" -ForegroundColor Red
    }
}
catch {
    Write-Host "An error occurred while running Doxygen:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
