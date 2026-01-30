import { simpleGit } from 'simple-git'
import { GitInfo } from './types.js'
import * as path from 'path'
import * as fs from 'fs'

export async function getGitInfo(workspaceFolder: string): Promise<GitInfo> {
  try {
    // Check if directory exists
    if (!fs.existsSync(workspaceFolder)) {
      return { repoName: null, branch: null, isDirty: false }
    }

    const git = simpleGit(workspaceFolder)

    // Check if it's a git repo
    const isRepo = await git.checkIsRepo()
    if (!isRepo) {
      return { repoName: null, branch: null, isDirty: false }
    }

    // Get current branch
    const branch = await git.revparse(['--abbrev-ref', 'HEAD'])

    // Get repo name from remote URL or folder name
    let repoName: string | null = null
    try {
      const remotes = await git.getRemotes(true)
      if (remotes.length > 0 && remotes[0].refs.fetch) {
        const url = remotes[0].refs.fetch
        // Extract repo name from URL (works for both https and git@)
        const match = url.match(/\/([^\/]+?)(?:\.git)?$/)
        if (match) {
          repoName = match[1]
        }
      }
    } catch {
      // If remote fails, use folder name
      repoName = path.basename(workspaceFolder)
    }

    // If no remote, use folder name
    if (!repoName) {
      repoName = path.basename(workspaceFolder)
    }

    // Check if working directory is dirty
    const status = await git.status()
    const isDirty = !status.isClean()

    return {
      repoName,
      branch: branch.trim(),
      isDirty
    }
  } catch (error) {
    console.error(`Error getting git info for ${workspaceFolder}:`, error)
    return { repoName: null, branch: null, isDirty: false }
  }
}
