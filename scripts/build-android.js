const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const androidDirectory = path.resolve(__dirname, '..', 'android');
const gradleWrapper = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const gradleWrapperPath = path.join(androidDirectory, gradleWrapper);
const command = process.platform === 'win32' ? 'cmd.exe' : gradleWrapper;
const commandArguments = process.platform === 'win32'
  ? ['/d', '/s', '/c', `""${gradleWrapperPath}" assembleDebug"`]
  : ['assembleDebug'];

if (!fs.existsSync(gradleWrapperPath)) {
  console.error('Android project not found. Run "npm run android:setup" first.');
  process.exit(1);
}

const gradleJdksDirectory = path.join(os.homedir(), '.gradle', 'jdks');
const gradleJdkCandidates = fs.existsSync(gradleJdksDirectory)
  ? fs.readdirSync(gradleJdksDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(gradleJdksDirectory, entry.name))
  : [];
const javaHomeCandidates = [process.env.JAVA_HOME, ...gradleJdkCandidates].filter(Boolean);
const javaHome = javaHomeCandidates.find((candidate) => {
  const executable = path.join(candidate, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
  if (!fs.existsSync(executable)) {
    return false;
  }

  const versionOutput = spawnSync(executable, ['-version'], { encoding: 'utf8' });
  const version = `${versionOutput.stdout || ''}${versionOutput.stderr || ''}`.match(/version "(\d+)/i);
  return versionOutput.status === 0 && version && Number(version[1]) >= 17 && Number(version[1]) <= 24;
});

if (!javaHome) {
  console.error('Android builds require JDK 17-24 (JDK 21 recommended). Set JAVA_HOME to a compatible JDK.');
  process.exit(1);
}

const defaultSdkDirectory = process.platform === 'win32'
  ? path.join(process.env.LOCALAPPDATA || os.homedir(), 'Android', 'Sdk')
  : process.platform === 'darwin'
    ? path.join(os.homedir(), 'Library', 'Android', 'sdk')
    : path.join(os.homedir(), 'Android', 'Sdk');
const sdkDirectory = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || defaultSdkDirectory;
const buildEnvironment = { ...process.env };
buildEnvironment.JAVA_HOME = javaHome;
buildEnvironment.PATH = `${path.join(javaHome, 'bin')}${path.delimiter}${process.env.PATH || ''}`;

if (fs.existsSync(sdkDirectory)) {
  buildEnvironment.ANDROID_HOME = sdkDirectory;
  buildEnvironment.ANDROID_SDK_ROOT = sdkDirectory;
}

const build = spawn(command, commandArguments, {
  cwd: androidDirectory,
  env: buildEnvironment,
  windowsVerbatimArguments: process.platform === 'win32',
  stdio: 'inherit'
});

build.on('error', (error) => {
  console.error('Could not start the Android build:', error.message);
  process.exitCode = 1;
});

build.on('exit', (code) => {
  if (code !== 0) {
    process.exitCode = code || 1;
    return;
  }

  console.log('APK generated at android/app/build/outputs/apk/debug/app-debug.apk');
});
