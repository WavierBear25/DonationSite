@echo off
setlocal enabledelayedexpansion

:: Prompt for commit message
set /p commitmsg=Enter commit message: 

:: Check if commit message is empty
if "!commitmsg!"=="" (
    echo Commit message cannot be empty.
    pause
    exit /b 1
)

:: Run git commands
git add .
git commit -m "!commitmsg!"
git push origin main

pause
