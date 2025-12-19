/**
 * @fileoverview Beads Provisioner - Ensures `bd` CLI is available for BMAD workflows
 *
 * This module provisions the Beads CLI (`bd`) as a hard requirement for BMAD.
 * It installs @beads/bd into a project-local location (_bmad/_tools/beads/)
 * and creates wrapper scripts in _bmad/bin/ for cross-platform execution.
 *
 * BEADS IS REQUIRED: BMAD workflows will fail if bd is not available.
 */

const path = require('node:path');
const fs = require('fs-extra');
const { execSync, spawn } = require('node:child_process');
const chalk = require('chalk');

/**
 * Beads provisioner for BMAD installations
 */
class BeadsProvisioner {
  constructor() {}

  /**
   * Check if bd CLI is available (either project-local or system PATH)
   * @param {string} bmadDir - The _bmad directory path
   * @returns {Promise<{available: boolean, path: string|null, version: string|null}>}
   */
  async checkAvailability(bmadDir) {
    // First check project-local installation
    const localBdPath = this.getLocalBdPath(bmadDir);
    if (await this.verifyBd(localBdPath)) {
      const version = await this.getBdVersion(localBdPath);
      return { available: true, path: localBdPath, version, local: true };
    }

    // Check system PATH as fallback (but we prefer local)
    try {
      const version = execSync('bd version', { encoding: 'utf8', timeout: 10_000 }).trim();
      return { available: true, path: 'bd', version, local: false };
    } catch {
      return { available: false, path: null, version: null, local: false };
    }
  }

  /**
   * Get the path to the project-local bd executable
   * @param {string} bmadDir - The _bmad directory path
   * @returns {string} Path to local bd executable
   */
  getLocalBdPath(bmadDir) {
    const isWindows = process.platform === 'win32';
    const binDir = path.join(bmadDir, this.beadsBinDir);

    if (isWindows) {
      return path.join(binDir, 'bd.cmd');
    }
    return path.join(binDir, 'bd');
  }

  /**
   * Get the path to the actual bd binary inside node_modules
   * @param {string} bmadDir - The _bmad directory path
   * @returns {string} Path to bd binary in node_modules
   */
  getNodeModulesBdPath(bmadDir) {
    const isWindows = process.platform === 'win32';
    const nodeModulesDir = path.join(bmadDir, this.beadsToolsDir, 'node_modules', '.bin');

    if (isWindows) {
      return path.join(nodeModulesDir, 'bd.cmd');
    }
    return path.join(nodeModulesDir, 'bd');
  }

  /**
   * Verify that a bd binary works
   * @param {string} bdPath - Path to bd binary
   * @returns {Promise<boolean>}
   */
  async verifyBd(bdPath) {
    try {
      if (!(await fs.pathExists(bdPath))) {
        return false;
      }
      execSync(`"${bdPath}" version`, { encoding: 'utf8', timeout: 10_000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get version string from bd
   * @param {string} bdPath - Path to bd binary
   * @returns {Promise<string|null>}
   */
  async getBdVersion(bdPath) {
    try {
      const output = execSync(`"${bdPath}" version`, { encoding: 'utf8', timeout: 10_000 });
      return output.trim();
    } catch {
      return null;
    }
  }

  /**
   * Provision bd CLI into the BMAD installation
   * @param {string} bmadDir - The _bmad directory path
   * @param {Object} options - Provisioning options
   * @param {boolean} options.force - Force reinstall even if already present
   * @param {Function} options.onProgress - Progress callback (message: string)
   * @returns {Promise<{success: boolean, path: string, version: string, error?: string}>}
   */
  async provision(bmadDir, options = {}) {
    const { force = false, onProgress = () => {} } = options;

    // Check if already provisioned
    if (!force) {
      const existing = await this.checkAvailability(bmadDir);
      if (existing.available && existing.local) {
        onProgress(`Beads CLI already provisioned: ${existing.version}`);
        return { success: true, path: existing.path, version: existing.version };
      }
    }

    onProgress('Provisioning Beads CLI...');

    // Create directories
    const toolsDir = path.join(bmadDir, this.beadsToolsDir);
    const binDir = path.join(bmadDir, this.beadsBinDir);
    await fs.ensureDir(toolsDir);
    await fs.ensureDir(binDir);

    // Create minimal package.json for npm install
    const packageJson = {
      name: 'bmad-beads-tools',
      version: '1.0.0',
      private: true,
      description: 'BMAD Beads CLI provisioning',
      dependencies: {
        '@beads/bd': 'latest',
      },
    };

    try {
      await fs.writeJson(path.join(toolsDir, 'package.json'), packageJson, { spaces: 2 });
    } catch (error) {
      return {
        success: false,
        path: null,
        version: null,
        error: `Failed to write package.json: ${error.message}`,
      };
    }

    // Run npm install
    onProgress('Installing @beads/bd (this may take a moment)...');

    try {
      await this.runNpmInstall(toolsDir);
    } catch (error) {
      return {
        success: false,
        path: null,
        version: null,
        error: `Failed to install @beads/bd: ${error.message}`,
      };
    }

    // Verify the binary was installed
    const nodeModulesBdPath = this.getNodeModulesBdPath(bmadDir);
    if (!(await this.verifyBd(nodeModulesBdPath))) {
      return {
        success: false,
        path: null,
        version: null,
        error: 'Beads binary not found after npm install. Check network connectivity and try again.',
      };
    }

    // Create wrapper scripts in _bmad/bin/
    onProgress('Creating bd wrapper scripts...');
    await this.createWrapperScripts(bmadDir, nodeModulesBdPath);

    // Verify the wrapper works
    const localBdPath = this.getLocalBdPath(bmadDir);
    if (!(await this.verifyBd(localBdPath))) {
      return {
        success: false,
        path: null,
        version: null,
        error: 'Beads wrapper script failed verification.',
      };
    }

    const version = await this.getBdVersion(localBdPath);
    onProgress(`Beads CLI provisioned successfully: ${version}`);

    return { success: true, path: localBdPath, version };
  }

  /**
   * Run npm install in the tools directory
   * @param {string} toolsDir - Directory containing package.json
   * @returns {Promise<void>}
   */
  async runNpmInstall(toolsDir) {
    return new Promise((resolve, reject) => {
      const isWindows = process.platform === 'win32';
      const npmCmd = isWindows ? 'npm.cmd' : 'npm';

      const child = spawn(npmCmd, ['install', '--production', '--no-save'], {
        cwd: toolsDir,
        stdio: 'pipe',
        shell: isWindows,
      });

      let stderr = '';
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`npm install failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to run npm: ${error.message}`));
      });
    });
  }

  /**
   * Create wrapper scripts for bd in _bmad/bin/
   * @param {string} bmadDir - The _bmad directory path
   * @param {string} actualBdPath - Path to the actual bd binary
   */
  async createWrapperScripts(bmadDir, actualBdPath) {
    const binDir = path.join(bmadDir, this.beadsBinDir);

    // Unix wrapper (bash)
    const unixWrapper = `#!/bin/sh
# BMAD Beads CLI wrapper - auto-generated
# This wrapper ensures bd is invoked from the project-local installation

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BD_PATH="${actualBdPath}"

# Fallback to relative path if absolute doesn't exist
if [ ! -x "$BD_PATH" ]; then
  BD_PATH="$SCRIPT_DIR/../${this.beadsToolsDir}/node_modules/.bin/bd"
fi

if [ ! -x "$BD_PATH" ]; then
  echo "Error: Beads CLI (bd) not found. Run BMAD installer to provision." >&2
  exit 1
fi

exec "$BD_PATH" "$@"
`;

    // Windows wrapper (cmd)
    const windowsWrapper = `@echo off
REM BMAD Beads CLI wrapper - auto-generated
REM This wrapper ensures bd is invoked from the project-local installation

set "SCRIPT_DIR=%~dp0"
set "BD_PATH=${actualBdPath}"

if not exist "%BD_PATH%" (
  set "BD_PATH=%SCRIPT_DIR%..\\${this.beadsToolsDir.replaceAll('/', '\\')}\\node_modules\\.bin\\bd.cmd"
)

if not exist "%BD_PATH%" (
  echo Error: Beads CLI (bd) not found. Run BMAD installer to provision. >&2
  exit /b 1
)

"%BD_PATH%" %*
`;

    // Write both wrappers
    const unixPath = path.join(binDir, 'bd');
    const windowsPath = path.join(binDir, 'bd.cmd');

    await fs.writeFile(unixPath, unixWrapper, { mode: 0o755 });
    await fs.writeFile(windowsPath, windowsWrapper);
  }

  /**
   * Initialize Beads in the project directory (runs `bd init --quiet`)
   * @param {string} projectDir - The project root directory
   * @param {string} bdPath - Path to bd executable
   * @param {Object} options - Init options
   * @param {string} options.prefix - Optional issue prefix
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async initializeBeads(projectDir, bdPath, options = {}) {
    const { prefix } = options;

    // Check if already initialized
    const beadsDir = path.join(projectDir, '.beads');
    if (await fs.pathExists(beadsDir)) {
      return { success: true, alreadyInitialized: true };
    }

    // Check if in a git repo (beads requires git)
    try {
      execSync('git rev-parse --git-dir', { cwd: projectDir, encoding: 'utf8', timeout: 5000 });
    } catch {
      return {
        success: false,
        error: 'Beads requires a git repository. Run `git init` first.',
      };
    }

    // Run bd init --quiet
    try {
      const args = ['init', '--quiet'];
      if (prefix) {
        args.push('--prefix', prefix);
      }

      execSync(`"${bdPath}" ${args.join(' ')}`, {
        cwd: projectDir,
        encoding: 'utf8',
        timeout: 30_000,
      });

      return { success: true, alreadyInitialized: false };
    } catch (error) {
      return {
        success: false,
        error: `Failed to initialize Beads: ${error.message}`,
      };
    }
  }

  /**
   * Full provisioning + initialization flow
   * @param {string} projectDir - Project root directory
   * @param {string} bmadDir - The _bmad directory path
   * @param {Object} options - Options
   * @returns {Promise<{success: boolean, bdPath: string, version: string, error?: string}>}
   */
  async provisionAndInitialize(projectDir, bmadDir, options = {}) {
    const { onProgress = () => {}, prefix } = options;

    // Step 1: Provision bd
    const provisionResult = await this.provision(bmadDir, { onProgress });
    if (!provisionResult.success) {
      return provisionResult;
    }

    // Step 2: Initialize beads in project
    onProgress('Initializing Beads database...');
    const initResult = await this.initializeBeads(projectDir, provisionResult.path, { prefix });

    if (!initResult.success) {
      return {
        success: false,
        bdPath: provisionResult.path,
        version: provisionResult.version,
        error: initResult.error,
      };
    }

    if (initResult.alreadyInitialized) {
      onProgress('Beads database already initialized');
    } else {
      onProgress('Beads database initialized successfully');
    }

    return {
      success: true,
      bdPath: provisionResult.path,
      version: provisionResult.version,
    };
  }

  /**
   * Display remediation steps if provisioning fails
   * @param {string} error - Error message
   */
  static displayRemediationSteps(error) {
    console.error(chalk.red('\n❌ Beads CLI provisioning failed'));
    console.error(chalk.dim(`   Error: ${error}`));
    console.log(chalk.yellow('\n📋 Remediation steps:'));
    console.log(chalk.white('   1. Ensure you have Node.js 18+ and npm installed'));
    console.log(chalk.white('   2. Check network connectivity (npm needs to download @beads/bd)'));
    console.log(chalk.white('   3. Try running: npm install -g @beads/bd'));
    console.log(chalk.white('   4. Re-run the BMAD installer'));
    console.log(chalk.dim('\n   For manual installation, see: https://github.com/steveyegge/beads'));
  }
  beadsToolsDir = '_tools/beads';
  beadsBinDir = 'bin';
  beadsPackage = '@beads/bd';
}

module.exports = { BeadsProvisioner };
