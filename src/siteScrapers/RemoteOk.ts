import { Page } from "puppeteer"
import { BaseScraper } from "../core/BaseScraper"
import { JobListing } from "../core/types.js"

export class RemoteOkScraper extends BaseScraper {
  site = "remoteok.com"

  async waitForLoad(page: Page) {
    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll("tbody tr.job")).some(
        (row) => !row.classList.contains("placeholder")
      )
    })
  }

  async listJobs(page: Page): Promise<JobListing[]> {
    const allRows = await page.$$("tbody tr")
    const jobRows: typeof allRows = []

    for (const row of allRows) {
      const hasJobClass = await row.evaluate((el) => el.classList.contains("job"))
      if (hasJobClass) jobRows.push(row)
    }

    const results = await Promise.all(
      jobRows.map((row) =>
        row.evaluate((el: HTMLTableRowElement) => {
          const a = el.querySelector<HTMLAnchorElement>(".preventLink")
          return a ? { id: el.id, url: a.href } : null
        })
      )
    )

    return results.filter((row): row is JobListing => row !== null)
  }
}
