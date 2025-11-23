<#
.SYNOPSIS
  Backup database and apply safe migration to add/normalize `banned_ips.ip` and `users.last_ip`.

.DESCRIPTION
  This script will (1) ask for confirmation, (2) back up the database using pg_dump,
  (3) write and execute an idempotent SQL migration that ensures `users.last_ip` and
  `banned_ips.ip` exist and copies/normalizes legacy `ip_address` values, and (4)
  run a few verification queries and print results.

  Requirements: `pg_dump` and `psql` must be available on PATH. The script prefers
  using the environment variable `DATABASE_URL`. If not set, you'll be prompted to enter
  a connection string like `postgresql://user:pass@host:port/dbname`.

USAGE
  In PowerShell, from the repo root or this scripts folder:
    .\server\scripts\fix-banned-ips.ps1

  Type YES at the confirmation prompt to proceed.
#>

Set-StrictMode -Version Latest
Write-Host "\n=== MR_Auctioner: Fix banned_ips / last_ip Migration Script ===\n"

$confirm = Read-Host "This will BACKUP your DB and APPLY schema changes. Type YES to continue"
if ($confirm -ne 'YES'){
  Write-Host "Aborted by user. No changes applied." -ForegroundColor Yellow
  exit 1
}

# Determine connection string
$db = $env:DATABASE_URL
if (-not $db){
  $db = Read-Host "Enter PostgreSQL connection string (postgresql://user:pass@host:port/dbname)"
  if (-not $db){ Write-Error "No connection string provided. Aborting."; exit 2 }
}

try{
  # Build backup filename next to this script
  $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
  $timestamp = Get-Date -Format yyyyMMdd_HHmmss
  $backupFile = Join-Path -Path $scriptDir -ChildPath "..\backup_mr_auctioner_$timestamp.dump"
  $backupFile = [System.IO.Path]::GetFullPath($backupFile)

  Write-Host "Creating backup with pg_dump to: $backupFile" -ForegroundColor Cyan
  & pg_dump "--dbname=$db" -F c -f "$backupFile"
  if ($LASTEXITCODE -ne 0){ Write-Error "pg_dump failed (exit $LASTEXITCODE). Aborting."; exit $LASTEXITCODE }

  # Write idempotent SQL migration to temp file
  $sqlFile = Join-Path $scriptDir 'fix-banned-ips.sql'
  $sql = @"
BEGIN;

-- Ensure users.last_ip exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ip text;

-- Ensure banned_ips.ip exists
ALTER TABLE banned_ips ADD COLUMN IF NOT EXISTS ip text;

-- Copy and normalize legacy ip_address -> ip where ip is empty
UPDATE banned_ips
SET ip = CASE
  WHEN ip_address IS NOT NULL AND ip_address <> '' THEN
    CASE
      WHEN ip_address = '::1' THEN '127.0.0.1'
      ELSE regexp_replace(ip_address, '^::ffff:', '')
    END
  ELSE ip
END
WHERE (ip IS NULL OR ip = '') AND (ip_address IS NOT NULL AND ip_address <> '');

-- Map any remaining IPv6 loopback forms to 127.0.0.1
UPDATE banned_ips
SET ip = '127.0.0.1'
WHERE ip IN ('::1', '0:0:0:0:0:0:0:1');

-- Create unique index on ip if missing
CREATE UNIQUE INDEX IF NOT EXISTS banned_ips_ip_idx ON banned_ips (ip);

COMMIT;
"@

  $sql | Out-File -FilePath $sqlFile -Encoding UTF8 -Force

  Write-Host "Running migration SQL via psql..." -ForegroundColor Cyan
  & psql "$db" -f "$sqlFile"
  if ($LASTEXITCODE -ne 0){ Write-Error "psql migration failed (exit $LASTEXITCODE). Inspect output above."; exit $LASTEXITCODE }

  Write-Host "\nMigration applied. Running verification queries..." -ForegroundColor Green
  Write-Host "\n\d+ banned_ips" -ForegroundColor Gray
  & psql "$db" -c "\d+ banned_ips"

  Write-Host "\nSample rows from banned_ips" -ForegroundColor Gray
  & psql "$db" -c "SELECT id, ip, ip_address, reason, banned_until FROM banned_ips ORDER BY id DESC LIMIT 20;"

  Write-Host "\nCheck users.last_ip column" -ForegroundColor Gray
  & psql "$db" -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users' AND column_name='last_ip';"

  Write-Host "\nDone. Review the output above. If anything looks wrong, paste the errors here and I'll help." -ForegroundColor Green
  exit 0

} catch {
  Write-Error "Unexpected error: $_"
  exit 10
}
