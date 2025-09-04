@echo off
echo Building TypeScript files...
call npx tsc
if %ERRORLEVEL% neq 0 (
    echo TypeScript compilation failed!
    pause
    exit /b 1
)

echo TypeScript compilation successful!
echo Starting local server on http://localhost:8000
echo Press Ctrl+C to stop the server
python -m http.server 8000