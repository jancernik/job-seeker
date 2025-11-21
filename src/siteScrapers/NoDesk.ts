import { Page } from "puppeteer"
import { BaseScraper } from "../core/BaseScraper"
import { JobListing } from "../core/types.js"

export class NoDeskScraper extends BaseScraper {
  site = "nodesk.co"

  async waitForLoad(page: Page) {
    await page.waitForSelector(".ais-Hits-list .ais-Hits-item")
  }

  async listJobs(page: Page, tags:Array<string>): Promise<JobListing[]> {
    const source = page.url()
    const allJobs = await page.$$(".ais-Hits-list .ais-Hits-item")

    const filteredJobs: typeof allJobs = []
    for (const item of allJobs) {
      const matches = await item.evaluate(
        (el: Element, allowed: string[]) => {
          const locations = Array.from(el.querySelectorAll("h5"))
          return locations.some((h) => allowed.includes(h.textContent?.trim() || ""))
        },
        tags
      )
      if (matches) filteredJobs.push(item)
    }

    const results = await Promise.all(
      filteredJobs.map((item) =>
        item.evaluate((el: Element, source: string) => {
          const a = el.querySelector(".link") as HTMLAnchorElement | null
          const id = a?.href ? new URL(a.href).pathname.replaceAll("/", "") : null
          return a && id ? { id, url: a.href, source } : null
        }, source)
      )
    )

    return results.filter((row): row is JobListing => row !== null)
  }
}
