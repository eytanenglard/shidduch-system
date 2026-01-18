@echo off
REM ================================================================================
REM Supabase PostgreSQL Backup Script for Windows
REM ================================================================================

REM --------------------------------------------
REM Configuration - MODIFY THESE VALUES
REM --------------------------------------------

REM Supabase Database Connection URL
SET DATABASE_URL="postgresql://postgres@db.pwkwidqfbojftjumlzra.supabase.co:5432/postgres?sslmode=require"

REM Supabase Database Password
SET PGPASSWORD=bqSWwXIdHw1tATgc

REM AWS S3 Bucket Name
SET S3_BUCKET_NAME="eytan-neon-db-backups"

REM Temporary local directory for backup files (WITHOUT QUOTES)
REM <-- תיקון: הוסרו המרכאות מההגדרה
SET BACKUP_DIR=C:\Temp\SupabaseBackups

REM Path to 7-Zip executable (WITHOUT QUOTES)
REM <-- תיקון: הוסרו המרכאות מההגדרה
SET SEVENZIP_PATH=C:\Program Files\7-Zip\7z.exe

REM GPG Encryption Settings (Optional)
SET ENCRYPT_BACKUP=false
SET GPG_RECIPIENT="your_gpg_key_id_or_email"

REM --- End of User Configuration ---

REM --------------------------------------------
REM Script Logic - DO NOT MODIFY BELOW THIS LINE (unless you know what you're doing)
REM --------------------------------------------

REM Temporarily store original PGPASSWORD if it was set globally, and restore it at the end.
SET PGPASSWORD_TEMP_HOLDER=%PGPASSWORD%

REM Create timestamp for backup filename (YYYYMMDD_HHMMSS)
FOR /F "tokens=2 delims==" %%I IN ('wmic os get localdatetime /format:list') DO SET LDT=%%I
SET DATE_FORMAT=%LDT:~0,8%_%LDT:~8,6%

SET BACKUP_FILENAME_BASE=supabase_db_backup_%DATE_FORMAT%
SET RAW_BACKUP_FILENAME=%BACKUP_FILENAME_BASE%.dump
SET RAW_BACKUP_FILEPATH=%BACKUP_DIR%\%RAW_BACKUP_FILENAME%

SET COMPRESSED_BACKUP_FILENAME=%RAW_BACKUP_FILENAME%.gz
SET COMPRESSED_BACKUP_FILEPATH=%BACKUP_DIR%\%COMPRESSED_BACKUP_FILENAME%

SET FINAL_UPLOAD_FILENAME=%COMPRESSED_BACKUP_FILENAME%
SET FINAL_UPLOAD_FILEPATH=%COMPRESSED_BACKUP_FILEPATH%

IF "%ENCRYPT_BACKUP%"=="true" (
    SET ENCRYPTED_BACKUP_FILENAME=%COMPRESSED_BACKUP_FILENAME%.gpg
    SET ENCRYPTED_BACKUP_FILEPATH=%BACKUP_DIR%\%ENCRYPTED_BACKUP_FILENAME%
    SET FINAL_UPLOAD_FILENAME=%ENCRYPTED_BACKUP_FILENAME%
    SET FINAL_UPLOAD_FILEPATH=%ENCRYPTED_BACKUP_FILEPATH%
)

REM Create temporary backup directory if it doesn't exist
IF NOT EXIST "%BACKUP_DIR%" (
    echo Creating backup directory: %BACKUP_DIR%
    mkdir "%BACKUP_DIR%"
    IF %ERRORLEVEL% NEQ 0 (
        echo ERROR: Could not create backup directory %BACKUP_DIR%. Exiting.
        GOTO EndScriptError
    )
)

echo Starting Supabase database backup: %DATE% %TIME%

REM Display DATABASE_URL for debugging (without password)
echo DEBUG: Attempting to connect to URL: %DATABASE_URL%
echo DEBUG: Using PGPASSWORD (not shown for security)

REM Step 1: Dump the database using pg_dump
echo Dumping database to "%RAW_BACKUP_FILEPATH%"...
pg_dump --format=custom --dbname=%DATABASE_URL% --file="%RAW_BACKUP_FILEPATH%"
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Database dump (pg_dump) failed. Exit code: %ERRORLEVEL%
    GOTO EndScriptError
)
echo Database dump successful.

REM Step 2: Compress the backup file using 7-Zip
echo Compressing backup file "%RAW_BACKUP_FILEPATH%" to "%COMPRESSED_BACKUP_FILEPATH%"...
"%SEVENZIP_PATH%" a -tgzip "%COMPRESSED_BACKUP_FILEPATH%" "%RAW_BACKUP_FILEPATH%" -mx=9
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Compression (7-Zip) failed. Exit code: %ERRORLEVEL%
    IF EXIST "%RAW_BACKUP_FILEPATH%" DEL /Q "%RAW_BACKUP_FILEPATH%"
    GOTO EndScriptError
)
echo Compression successful.

REM Delete the uncompressed raw backup file
IF EXIST "%RAW_BACKUP_FILEPATH%" (
    echo Deleting raw backup file: "%RAW_BACKUP_FILEPATH%"
    DEL /Q "%RAW_BACKUP_FILEPATH%"
)

REM Step 3 (Optional): Encrypt the compressed backup file
IF "%ENCRYPT_BACKUP%"=="true" (
    echo Encrypting backup file "%COMPRESSED_BACKUP_FILEPATH%"...
    gpg --encrypt --recipient "%GPG_RECIPIENT%" --output "%ENCRYPTED_BACKUP_FILEPATH%" "%COMPRESSED_BACKUP_FILEPATH%"
    IF %ERRORLEVEL% NEQ 0 (
        echo ERROR: Encryption (GPG) failed. Exit code: %ERRORLEVEL%
        IF EXIST "%COMPRESSED_BACKUP_FILEPATH%" DEL /Q "%COMPRESSED_BACKUP_FILEPATH%"
        IF EXIST "%ENCRYPTED_BACKUP_FILEPATH%" DEL /Q "%ENCRYPTED_BACKUP_FILEPATH%"
        GOTO EndScriptError
    )
    echo Encryption successful.
    REM Delete the unencrypted compressed backup file
    IF EXIST "%COMPRESSED_BACKUP_FILEPATH%" (
        echo Deleting compressed (unencrypted) backup file: "%COMPRESSED_BACKUP_FILEPATH%"
        DEL /Q "%COMPRESSED_BACKUP_FILEPATH%"
    )
)

REM Step 4: Upload the final backup file to AWS S3
echo Uploading "%FINAL_UPLOAD_FILENAME%" to S3 bucket "%S3_BUCKET_NAME%"...
aws s3 cp "%FINAL_UPLOAD_FILEPATH%" "s3://%S3_BUCKET_NAME%/%FINAL_UPLOAD_FILENAME%"
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Upload to S3 failed. Exit code: %ERRORLEVEL%
    REM Do not delete the local file if upload failed, so it can be manually retrieved
    GOTO EndScriptError
)
echo Upload to S3 successful.

REM Step 5: Clean up the local final backup file
IF EXIST "%FINAL_UPLOAD_FILEPATH%" (
    echo Cleaning up local backup file: "%FINAL_UPLOAD_FILEPATH%"
    DEL /Q "%FINAL_UPLOAD_FILEPATH%"
)

echo Supabase backup process completed successfully: %DATE% %TIME%
GOTO EndScriptSuccess

:EndScriptError
echo SCRIPT FINISHED WITH ERRORS.
IF DEFINED PGPASSWORD_TEMP_HOLDER (
    SET PGPASSWORD=%PGPASSWORD_TEMP_HOLDER%
) ELSE (
    SET PGPASSWORD=
)
SET PGPASSWORD_TEMP_HOLDER=
@echo on
exit /b 1

:EndScriptSuccess
IF DEFINED PGPASSWORD_TEMP_HOLDER (
    SET PGPASSWORD=%PGPASSWORD_TEMP_HOLDER%
) ELSE (
    SET PGPASSWORD=
)
SET PGPASSWORD_TEMP_HOLDER=
@echo on
exit /b 0