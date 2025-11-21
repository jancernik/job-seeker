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

  async getNewJobs(
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
        date: new Date().toISOString(),
        seen: isFirstRun
      }))

    if (newJobs.length > 0) {
      const allJobs = [...existingJobs, ...newJobs]
      await this.save(site, allJobs)
    }

    return isFirstRun ? [] : newJobs
  }

  async getUnseenJobs(): Promise<StoredJobListing[]> {
    await this.ensureDataDir()
    const files = await fs.readdir(this.dataDir)
    const jsonFiles = files.filter((file) => file.endsWith(".json"))

    const unseenJobs: StoredJobListing[] = []
    for (const file of jsonFiles) {
      const jobs = await fs.readJson(path.join(this.dataDir, file))
      const unseen = jobs.filter((job: StoredJobListing) => !job.seen)
      unseenJobs.push(...unseen)
    }

    return unseenJobs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  async markAsSeen(jobId: string): Promise<void> {
    await this.ensureDataDir()
    const files = await fs.readdir(this.dataDir)
    const jsonFiles = files.filter((file) => file.endsWith(".json"))

    for (const file of jsonFiles) {
      const filePath = path.join(this.dataDir, file)
      const jobs: StoredJobListing[] = await fs.readJson(filePath)
      const updated = jobs.map((job) => (job.id === jobId ? { ...job, seen: true } : job))

      if (JSON.stringify(jobs) !== JSON.stringify(updated)) {
        await fs.writeJson(filePath, updated, { spaces: 2 })
        break
      }
    }
  }
}
