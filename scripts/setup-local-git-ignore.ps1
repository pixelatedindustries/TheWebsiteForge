# Adds local-only ignore entries so these .github assistant files are ignored by git on this machine.
# This does NOT add them to the repo or any pushed .gitignore file.

$gitDir = Resolve-Path .git -ErrorAction SilentlyContinue
if (-not $gitDir) {
  Write-Error "No git repository found. Run 'git init' in the repo root first."
  exit 1
}

$excludeFile = Join-Path $gitDir "info\exclude"
$patterns = @(
  ".github/copilot-instructions.md",
  ".github/skills/",
  ".github/agents/"
)

Write-Host "Updating local git exclude file: $excludeFile"
foreach ($pattern in $patterns) {
  if (-not (Select-String -Path $excludeFile -Pattern "^\Q$pattern\E$" -SimpleMatch -Quiet)) {
    Add-Content -Path $excludeFile -Value $pattern
    Write-Host "Added ignore pattern: $pattern"
  } else {
    Write-Host "Pattern already present: $pattern"
  }
}

Write-Host "Local-only git ignore setup complete. These files will be ignored locally and not pushed."
