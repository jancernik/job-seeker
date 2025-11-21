import { Page } from "puppeteer"
import { BaseScraper } from "../core/BaseScraper"
import { JobListing } from "../core/types.js"

export class BuiltInScraper extends BaseScraper {
  site = "builtin.com"

  async waitForLoad(page: Page) {
    await page.waitForSelector('[data-id="job-card"]')
  }

  async listJobs(page: Page): Promise<JobListing[]> {
    const jobDivs = await page.$$('#jobs-list div[data-id="job-card"]')

    const results = await Promise.all(
      jobDivs.map((row) =>
        row.evaluate((el: HTMLDivElement) => {
          const a = el.querySelector<HTMLAnchorElement>("h2 a")
          return a ? { id: el.id, url: a.href } : null
        })
      )
    )

    return results.filter((row): row is JobListing => row !== null)
  }
}
