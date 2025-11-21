import { Page } from "puppeteer"
import { BaseScraper } from "../core/BaseScraper"
import { JobListing } from "../core/types.js"

export class RemoteYeahScraper extends BaseScraper {
  site = "remoteyeah.com"

  async waitForLoad(page: Page) {
    await page.waitForSelector('.job-list__cards .job-card')
  }

  async listJobs(page: Page): Promise<JobListing[]> {
    const source = page.url()
    const jobListings = await page.$$('.job-list__cards .job-card')

    const results = await Promise.all(
      jobListings.map((item) =>
        item.evaluate((el: Element, source: string) => {
          const a = el.querySelector("a.job-card__title") as HTMLAnchorElement | null
          const id = a?.href
            ? new URL(a.href).pathname.replace(/\/jobs\/|\//g, "")
            : null
          return a && id ? { id, url: a.href, source } : null
        }, source)
      )
    )

    return results.filter((row): row is JobListing => row !== null)
  }
}