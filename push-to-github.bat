@echo off
title Push HabitFlow to GitHub
cls
echo ===================================================
echo             HabitFlow GitHub Deployer
echo ===================================================
echo.

:: Check for Git
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed on this system!
    echo Please download and install Git from: https://git-scm.com/
    echo After installing, restart this script.
    echo.
    pause
    exit /b 1
)

:: Initialize git repository if it doesn't exist
if not exist .git (
    echo [INFO] Initializing new Git repository...
    git init
    git branch -M main
) else (
    echo [INFO] Git repository already initialized.
)

:: Add files
echo [INFO] Staging project files...
git add .

:: Commit files
echo [INFO] Committing changes...
git commit -m "Setup Capacitor Android and GitHub Actions APK build pipeline"

echo.
echo ===================================================
echo STEP 2: Configure GitHub Repository
echo ===================================================
echo.
echo To build the APK, you need to create a repository on GitHub.
echo 1. Go to https://github.com/new
echo 2. Name your repository (e.g. "habitflow")
echo 3. Click "Create repository" (do NOT add a README, license, or .gitignore)
echo 4. Copy the repository URL (it looks like https://github.com/username/habitflow.git)
echo.

set /p REPO_URL="Paste your GitHub Repository URL here: "

if "%REPO_URL%"=="" (
    echo [ERROR] Repository URL cannot be empty!
    pause
    exit /b 1
)

:: Remove existing origin if it exists
git remote remove origin >nul 2>nul

:: Add new origin remote
echo [INFO] Linking to repository %REPO_URL%...
git remote add origin %REPO_URL%

:: Push to GitHub
echo [INFO] Pushing files to GitHub (main)...
git push -u origin main --force

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Push failed. Make sure:
    echo 1. The GitHub repository URL is correct.
    echo 2. You are authenticated with Git (credentials helper is set up).
    echo 3. The repository exists and is empty.
    echo.
) else (
    echo.
    echo [SUCCESS] Code successfully pushed to GitHub!
    echo.
    echo ===================================================
    echo HOW TO DOWNLOAD YOUR APK:
    echo ===================================================
    echo 1. Open your browser and go to your repository on GitHub.
    echo 2. Click on the "Actions" tab at the top.
    echo 3. You will see a running workflow named "Build Android APK".
    echo 4. Wait 2 minutes for it to complete (turn green).
    echo 5. Click on the completed run.
    echo 6. Scroll down to the "Artifacts" section at the bottom.
    echo 7. Click on "HabitFlow-APK" to download your ZIP file containing the APK!
    echo 8. Extract the APK and install it on your phone!
    echo.
)

pause
