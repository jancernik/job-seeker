import { Page } from "puppeteer"
import { BaseScraper } from "../core/BaseScraper"
import { JobListing } from "../core/types.js"

export class WorkingNomadsScraper extends BaseScraper {
  site = "www.workingnomads.com"

  async waitForLoad(page: Page) {
    await page.waitForSelector(".job-desktop[id]")
  }

  async listJobs(page: Page): Promise<JobListing[]> {
    const jobListings = await page.$$(".job-desktop[id]")

    const results = await Promise.all(
      jobListings.map((item) =>
        item.evaluate((el: Element) => {
          const a = el.querySelector("h4 a") as HTMLAnchorElement | null
          return a ? { id: el.id, url: a.href } : null
        })
      )
    )

    return results.filter((row): row is JobListing => row !== null)
  }
}
