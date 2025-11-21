import { Page } from "puppeteer"
import { BaseScraper } from "../core/BaseScraper"
import { JobListing } from "../core/types.js"

export class WeWorkRemotelyScraper extends BaseScraper {
  site = "weworkremotely.com"

  async waitForLoad(page: Page) {
    await page.waitForSelector(".listing-link--unlocked")
  }

  async listJobs(page: Page): Promise<JobListing[]> {
    const jobListings = await page.$$(".new-listing-container:not(.feature--ad)")

    const results = await Promise.all(
      jobListings.map((item) =>
        item.evaluate((el: Element) => {
          const a = el.querySelector(".listing-link--unlocked") as HTMLAnchorElement | null
          const id = a?.href ? new URL(a.href).pathname.replace(/\/remote-jobs\/|\//g, "") : null
          return a && id ? { id, url: a.href } : null
        })
      )
    )

    return results.filter((row): row is JobListing => row !== null)
  }
}
