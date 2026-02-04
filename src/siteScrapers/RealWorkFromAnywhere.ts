import { Page } from "puppeteer"
import { BaseScraper } from "../core/BaseScraper"
import { JobListing } from "../core/types.js"

export class RealWorkFromAnywhereScraper extends BaseScraper {
  site = "www.realworkfromanywhere.com"

  async waitForLoad(page: Page) {
    await page.waitForSelector("section:not(.grid-background)")
  }

  async listJobs(page: Page): Promise<JobListing[]> {
    const source = page.url()
    const jobListings = await page.$$("section:not(.grid-background) > div.flex a.w-full")

    const results = await Promise.all(
      jobListings.map((item) =>
        item.evaluate((el: Element, source: string) => {
          const a = el as HTMLAnchorElement
          const id = a?.href ? new URL(a.href).pathname.replace(/\/jobs\/|\//g, "") : null
          return a.href ? { id, url: a.href, source } : null
        }, source)
      )
    )

    return results.filter((row): row is JobListing => row !== null)
  }
}
