import fs from "fs-extra"
import path from "path"
import { Page } from "puppeteer"

export class Screenshots {
  private screenshotsDir: string
  private maxPerSite: number

  constructor(screenshotsDir = "./screenshots", maxPerSite = 5) {
    this.screenshotsDir = screenshotsDir
    this.maxPerSite = maxPerSite
  }

  async ensureDir(): Promise<void> {
    await fs.ensureDir(this.screenshotsDir)
  }

  private async getScreenshotsForSite(site: string): Promise<string[]> {
    await this.ensureDir()
    const files = await fs.readdir(this.screenshotsDir)
    return files
      .filter((file) => file.startsWith(`${site}_`) && file.endsWith(".png"))
      .sort()
  }

  private async cleanupOldScreenshots(site: string): Promise<void> {
    const screenshots = await this.getScreenshotsForSite(site)

    if (screenshots.length >= this.maxPerSite) {
      const toDelete = screenshots.slice(0, screenshots.length - this.maxPerSite + 1)
      for (const file of toDelete) {
        await fs.remove(path.join(this.screenshotsDir, file))
      }
    }
  }

  async capture(page: Page, site: string): Promise<string> {
    await this.ensureDir()
    await this.cleanupOldScreenshots(site)

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `${site}_${timestamp}.png`
    const filepath = path.join(this.screenshotsDir, filename)

    await page.screenshot({ path: filepath, fullPage: true })

    return filepath
  }
}
