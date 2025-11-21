import { Page } from "puppeteer"
import { JobListing } from "./types"
import { urls, tags } from "./config"

export abstract class BaseScraper {
  abstract site: string

  getTargetUrls() {
    return urls.filter((url) => new URL(url).hostname === this.site)
  }

  getTargetTags() {
    return tags[this.site] || []
  }

  abstract waitForLoad(page: Page): Promise<void>
  abstract listJobs(page: Page, tags?: Array<string>): Promise<JobListing[]>
}
