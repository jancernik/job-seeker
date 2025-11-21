import { Page } from "puppeteer"
import { BaseScraper } from "../core/BaseScraper"
import { JobListing } from "../core/types.js"

export class RemoteRocketshipScraper extends BaseScraper {
  site = "www.remoterocketship.com"

  async waitForLoad(page: Page) {
    await page.waitForSelector(".sm\\:w-8\\/12.list-none")
  }

  async listJobs(page: Page): Promise<JobListing[]> {
    const jobListings = await page.$$(".sm\\:w-8\\/12.list-none")

    const results = await Promise.all(
      jobListings.map((item) =>
        item.evaluate((el: Element) => {
          const a = el.querySelector(".hidden a.bg-button-secondary") as HTMLAnchorElement | null
          const id = a?.href
            ? new URL(a.href).pathname.replace("/jobs/", "-").replace(/\/company\/|\//g, "")
            : null
          return a && id ? { id, url: a.href } : null
        })
      )
    )

    return results.filter((row): row is JobListing => row !== null)
  }
}
