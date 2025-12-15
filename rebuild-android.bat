@echo off
echo 💥 Cleaning old Android assets...
rmdir /s /q android\app\src\main\assets\public

echo 🚀 Building fresh Svelte app...
npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Svelte build failed!
    exit /b 1
)

echo 🔄 Copying build to Android...
npx cap copy android
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Capacitor copy failed!
    exit /b 1
)

echo 🧹 Cleaning Android Studio cache...
cd android
gradlew clean
cd ..

echo 📱 Running on Android device...
npx cap run android
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Capacitor run failed!
    exit /b 1
)

echo ✅ DONE! Your mobile app should now show the latest theme & layout.
pause