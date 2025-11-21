import { Page } from "puppeteer"
import { BaseScraper } from "../core/BaseScraper"
import { JobListing } from "../core/types.js"

export class BrainTrustScraper extends BaseScraper {
  site = "app.usebraintrust.com"

  async waitForLoad(page: Page) {
    await page.waitForSelector('[class^="MuiStack-root jobs-container"] [class^="styles_header"]')
  }

  async listJobs(page: Page): Promise<JobListing[]> {
    const source = page.url()
    const jobListings = await page.$$('[class^="MuiStack-root jobs-container"] [class^="styles_header"]')

    const results = await Promise.all(
      jobListings.map((item) =>
        item.evaluate((el: Element, source: string) => {
          const a = el.querySelector("a") as HTMLAnchorElement | null
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