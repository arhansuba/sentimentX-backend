// src/services/github.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import * as util from 'util';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

const execPromise = util.promisify(exec);

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);
  private cloneDir = path.join(__dirname, 'cloned-repos');

  /**
   * Clones a public GitHub repository to the server.
   * @param repoUrl The URL of the GitHub repository to clone (e.g., 'https://github.com/user/repo.git').
   * @returns The absolute path to the cloned repository.
   * @throws Error if the repository URL is invalid, cloning fails, or the repository is already cloned.
   */
  async cloneRepository(repoUrl: string): Promise<string> {
    try {
      const tempDir = path.join(os.tmpdir(), 'sentinel-repos');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const repoName = path.basename(repoUrl, '.git');
      const clonePath = path.join(tempDir, repoName);

      await execPromise(`git clone ${repoUrl} ${clonePath}`);

      this.logger.log(`Repository cloned to: ${clonePath}`);

      return clonePath;
    } catch (error) {
      this.logger.error(`Failed to clone repository: ${error.message}`);
      throw error instanceof Error ? error : new Error('Unknown cloning error');
    }
  }
}