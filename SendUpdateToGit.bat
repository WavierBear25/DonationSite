@echo off
setlocal enabledelayedexpansion

:: Ask for commit message
set /p commitmsg=Enter commit message: 

:: Check if commit message is empty
if "!commitmsg!"=="" (
    echo Commit message cannot be empty.
    pause
    exit /b 1
)

:: Add all changes
git add .

:: Commit with message
git commit -m "!commitmsg!"
if errorlevel 1 (
    echo Commit failed. Maybe no changes to commit.
) else (
    echo Commit successful.
)

:: Push to main branch
git push origin main
if errorlevel 1 (
    echo Push failed. Check your network and credentials.
) else (
    echo Push successful.
)

pause
