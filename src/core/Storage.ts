import fs from "fs-extra"
import path from "path"
import { JobListing, StoredJobListing } from "./types"

export class Storage {
  private dataDir: string

  constructor(dataDir = "./data") {
    this.dataDir = dataDir
  }

  private getFilePath(site: string): string {
    return path.join(this.dataDir, `${site}.json`)
  }

  async ensureDataDir(): Promise<void> {
    await fs.ensureDir(this.dataDir)
  }

  async load(site: string): Promise<StoredJobListing[]> {
    const filePath = this.getFilePath(site)
    if (!(await fs.pathExists(filePath))) {
      return []
    }
    return await fs.readJson(filePath)
  }

  async save(site: string, jobs: StoredJobListing[]): Promise<void> {
    await this.ensureDataDir()
    const filePath = this.getFilePath(site)
    await fs.writeJson(filePath, jobs, { spaces: 2 })
  }

  async isFirstRun(site: string): Promise<boolean> {
    const filePath = this.getFilePath(site)
    return !(await fs.pathExists(filePath))
  }

  async processJobs(
    site: string,
    scrapedJobs: JobListing[],
    isFirstRun: boolean
  ): Promise<StoredJobListing[]> {
    const existingJobs = await this.load(site)
    const existingIds = new Set(existingJobs.map((job) => job.id))

    const newJobs = scrapedJobs
      .filter((job) => !existingIds.has(job.id))
      .map((job) => ({
        ...job,
        date: new Date().toISOString()
      }))

    if (newJobs.length > 0) {
      const allJobs = [...existingJobs, ...newJobs]
      await this.save(site, allJobs)
    }

    return isFirstRun ? [] : newJobs
  }
}
