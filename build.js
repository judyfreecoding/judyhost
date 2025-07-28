import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const tempProjectDir = './tempproject';

// const homescreenRepUrl = 'https://github.com/judyfreecoding/homesreen.git'
// const resumeRepoUrl = 'https://github.com/Jeffreecoding/JunlinsResumeWebsite.git';
// const tetrisRepoUrl = 'https://github.com/Jeffreecoding/TetrisGame.git';



const homescreenProject = path.join(tempProjectDir, 'homesreen');
// const resumeProject = path.join(tempProjectDir, 'JunlinsResumeWebsite');
// const tetrisProject = path.join(tempProjectDir, 'TetrisGame');
const distDir = './dist';
// const gameDir = path.join(distDir, 'game', 'TetrisGame');

// Check for GitHub token
const githubToken = process.env.GITHUB_TOKEN;
if (!githubToken) {
  console.error('Error: GITHUB_TOKEN environment variable is required for private repositories');
  console.log('Please set GITHUB_TOKEN with your GitHub Personal Access Token');
  process.exit(1);
}

const authenticatedHomescreenUrl = `https://${githubToken}@github.com/judyfreecoding/homesreen.git`;
// const authenticatedResumeUrl = `https://${githubToken}@github.com/Jeffreecoding/JunlinsResumeWebsite.git`;
// const authenticatedTetrisUrl = `https://${githubToken}@github.com/Jeffreecoding/TetrisGame.git`;

// Setup temp project directory and clone/update repositories
console.log('Setting up temporary project directory...');
if (!fs.existsSync(tempProjectDir)) {
  fs.mkdirSync(tempProjectDir, { recursive: true });
}

// Handle JudyHomeSreenWebsite repository
if (!fs.existsSync(homescreenProject)) {
  console.log('Cloning JudyHomeSreenWebsite repository...');
  execSync(`git clone ${authenticatedHomescreenUrl}`, { cwd: tempProjectDir, stdio: 'inherit' });
} else {
  console.log('Updating JunlinsResumeWebsite repository...');
  execSync('git fetch origin && git reset --hard origin/main', { cwd: homescreenProject, stdio: 'inherit' });
}

// // Handle TetrisGame repository
// if (!fs.existsSync(tetrisProject)) {
//   console.log('Cloning TetrisGame repository...');
//   execSync(`git clone ${authenticatedTetrisUrl}`, { cwd: tempProjectDir, stdio: 'inherit' });
//   console.log('Installing TetrisGame dependencies...');
//   execSync('npm install', { cwd: tetrisProject, stdio: 'inherit' });
// } else {
//   console.log('Updating TetrisGame repository...');
//   execSync('git fetch origin && git reset --hard origin/main', { cwd: tetrisProject, stdio: 'inherit' });
//   console.log('Installing/updating TetrisGame dependencies...');
//   execSync('npm install', { cwd: tetrisProject, stdio: 'inherit' });
// }

console.log('Starting build process...');

try {
  // 1. Clean and create dist directory
  console.log('Cleaning dist directory...');
  if (fs.existsSync(distDir)) {
    execSync(`rimraf ${distDir}`, { stdio: 'inherit' });
  }
  fs.mkdirSync(distDir, { recursive: true });

  // 2. Install homescreen dependencies
  console.log('Installing homescreen dependencies...');
  execSync('npm install', { cwd: homescreenProject, stdio: 'inherit' });

  // 3. Build HomeScreen project
  console.log('Building HomeScreen project...');
  execSync('npm run build', { cwd: homescreenProject, stdio: 'inherit' });

  // 4. Copy HomeScreen build files
  console.log('Copying HomeScreen build files...');
  const homescreenDistDir = path.join(homescreenProject, 'dist');
  
  // Add copyDir function
  const copyDir = (src, dest) => {
    if (!fs.existsSync(src)) {
      throw new Error(`Source directory does not exist: ${src}`);
    }
    
    const items = fs.readdirSync(src, { withFileTypes: true });
    
    for (const item of items) {
      const srcPath = path.join(src, item.name);
      const destPath = path.join(dest, item.name);
      
      if (item.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };

  copyDir(homescreenDistDir, path.resolve(distDir));

  console.log('Build completed successfully!');
  
  // Clean up temporary project directory
  console.log('Cleaning up temporary files...');
  execSync(`rimraf ${tempProjectDir}`, { stdio: 'inherit' });
  console.log('Temporary files cleaned up.');
  
} catch (error) {
  console.error('Build failed:', error.message);
  
  // Clean up temporary project directory even on failure
  console.log('Cleaning up temporary files...');
  if (fs.existsSync(tempProjectDir)) {
    execSync(`rimraf ${tempProjectDir}`, { stdio: 'inherit' });
  }
  
  process.exit(1);
}









