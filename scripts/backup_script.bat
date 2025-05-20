@echo off
REM הגדרות - שנה בהתאם לצרכים שלך
REM --------------------------------------------
REM מומלץ מאוד להגדיר את אלה כמשתני סביבה במערכת ולא ישירות בקובץ
SET DATABASE_URL="postgresql://neondb_owner:npg_Droy27CwlpaJ@ep-falling-hill-a2e0isgz-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"
SET S3_BUCKET_NAME="eytan-neon-db-backups"
SET BACKUP_DIR="C:\Temp\Backups"
SET PGPASSWORD_TEMP_HOLDER=%PGPASSWORD%
SET PGPASSWORD=npg_Droy27CwlpaJ
REM שם קובץ עם חותמת זמן
FOR /F "tokens=1-4 delims=/ " %%i IN ('date /t') DO (SET D=%%l%%k%%j)
REM התאמת פורמט זמן ל-HHMMSS (יותר קל למיון וללא תוים בעייתיים)
FOR /F "tokens=1-3 delims=: " %%a IN ("%TIME%") DO (
    SET T_HH=%%a
    SET T_MM=%%b
    FOR /F "tokens=1 delims=." %%c IN ("%%c") DO SET T_SS=%%c
)
IF "%T_HH:~0,1%"==" " SET T_HH=0%T_HH:~1,1%
SET DATE_FORMAT=%D%_%T_HH%%T_MM%%T_SS%

SET BACKUP_FILENAME=db_backup_%DATE_FORMAT%.dump
SET BACKUP_FILEPATH=%BACKUP_DIR%\%BACKUP_FILENAME%
SET COMPRESSED_BACKUP_FILENAME=%BACKUP_FILENAME%.gz
SET COMPRESSED_BACKUP_FILEPATH=%BACKUP_DIR%\%COMPRESSED_BACKUP_FILENAME%

REM אופציונלי: הגדרות הצפנה GPG
SET ENCRYPT_BACKUP=false
REM <--- שנה ל-true אם אתה רוצה הצפנה והגדרת GPG
SET GPG_RECIPIENT="your_gpg_key_id_or_email"
SET ENCRYPTED_BACKUP_FILENAME=%COMPRESSED_BACKUP_FILENAME%.gpg
SET ENCRYPTED_BACKUP_FILEPATH=%BACKUP_DIR%\%ENCRYPTED_BACKUP_FILENAME%

REM נתיב ל-7z.exe (אם לא ב-PATH) - שנה אם צריך
SET SEVENZIP_PATH="C:\MinGW\bin\7z.exe"

REM --------------------------------------------
REM יצירת ספריית גיבויים זמנית אם לא קיימת
IF NOT EXIST "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
)

echo Starting database backup: %DATE% %TIME%

REM שלב 1: יצירת הגיבוי עם pg_dump
echo Dumping database to %BACKUP_FILEPATH%...
pg_dump --format=custom --dbname=%DATABASE_URL% --file="%BACKUP_FILEPATH%"
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Database dump failed. Exit code: %ERRORLEVEL%
    GOTO EndScript
)
echo Database dump successful.

REM שלב 2: דחיסת קובץ הגיבוי עם 7-Zip (יוצר .gz)
echo Compressing backup file %BACKUP_FILEPATH% to %COMPRESSED_BACKUP_FILEPATH%...
%SEVENZIP_PATH% a -tgzip "%COMPRESSED_BACKUP_FILEPATH%" "%BACKUP_FILEPATH%" -mx=9
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Compression failed.
    DEL /Q "%BACKUP_FILEPATH%"
    GOTO EndScript
)
echo Compression successful.
DEL /Q "%BACKUP_FILEPATH%"
REM מחק את הקובץ הלא דחוס

REM שלב 3 (אופציונלי): הצפנת קובץ הגיבוי
SET TARGET_UPLOAD_FILEPATH=%COMPRESSED_BACKUP_FILEPATH%
SET TARGET_UPLOAD_FILENAME=%COMPRESSED_BACKUP_FILENAME%

IF "%ENCRYPT_BACKUP%"=="true" (
    echo Encrypting backup file %COMPRESSED_BACKUP_FILEPATH%...
    gpg --encrypt --recipient "%GPG_RECIPIENT%" --output "%ENCRYPTED_BACKUP_FILEPATH%" "%COMPRESSED_BACKUP_FILEPATH%"
    IF %ERRORLEVEL% NEQ 0 (
        echo ERROR: Encryption failed.
        DEL /Q "%COMPRESSED_BACKUP_FILEPATH%"
        DEL /Q "%ENCRYPTED_BACKUP_FILEPATH%"
        GOTO EndScript
    )
    echo Encryption successful.
    SET TARGET_UPLOAD_FILEPATH=%ENCRYPTED_BACKUP_FILEPATH%
    SET TARGET_UPLOAD_FILENAME=%ENCRYPTED_BACKUP_FILENAME%
    DEL /Q "%COMPRESSED_BACKUP_FILEPATH%" 
    REM מחק את הקובץ הלא מוצפן
)

REM שלב 4: העלאת הגיבוי לאחסון חיצוני (S3)
echo Uploading %TARGET_UPLOAD_FILENAME% to S3 bucket %S3_BUCKET_NAME%...
aws s3 cp "%TARGET_UPLOAD_FILEPATH%" "s3://%S3_BUCKET_NAME%/%TARGET_UPLOAD_FILENAME%"
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Upload to S3 failed.
    GOTO EndScript
)
echo Upload to S3 successful.

REM שלב 5: ניקוי קבצים מקומיים
echo Cleaning up local backup file: %TARGET_UPLOAD_FILEPATH%
DEL /Q "%TARGET_UPLOAD_FILEPATH%"

echo Backup process completed successfully: %DATE% %TIME%

:EndScript
REM שחזור משתנה סביבה PGPASSWORD
SET PGPASSWORD=%PGPASSWORD_TEMP_HOLDER%
SET PGPASSWORD_TEMP_HOLDER=

@echo on
exit /b %ERRORLEVEL%