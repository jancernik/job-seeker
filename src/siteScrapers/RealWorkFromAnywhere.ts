import { Page } from "puppeteer"
import { BaseScraper } from "../core/BaseScraper"
import { JobListing } from "../core/types.js"

export class RealWorkFromAnywhereScraper extends BaseScraper {
  site = "www.realworkfromanywhere.com"

  async waitForLoad(page: Page) {
    await page.waitForSelector("section:not(.grid-background)")
  }

  async listJobs(page: Page): Promise<JobListing[]> {
    const jobDivs = await page.$$("section:not(.grid-background) > div > div")

    const results = await Promise.all(
      jobDivs.map((row) =>
        row.evaluate((el: HTMLDivElement) => {
          const a = el.querySelector<HTMLAnchorElement>("a.w-full.h-full")
          return a ? { id: el.id, url: a.href } : null
        })
      )
    )

    return results.filter((row): row is JobListing => row !== null)
  }
}
