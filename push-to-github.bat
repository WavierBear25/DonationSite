@echo off
cd /d %~dp0

echo Enter commit message (leave blank for "Update site"):
set /p msg=

if "%msg%"=="" set msg=Update site

git add .
git commit -m "%msg%"
git push origin main

pause
