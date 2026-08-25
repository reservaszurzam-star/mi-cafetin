@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Subir Cambios a GitHub - Mi Cafetin
echo ===================================================
echo   Subiendo ultimos cambios a GitHub (origin/main)...
echo ===================================================
echo.
"C:\Users\Julio Quispe\AppData\Local\Programs\MinGit\cmd\git.exe" push origin main
echo.
echo ===================================================
pause
