import puppeteer from "puppeteer"
import { scrapers } from "./core/scrapers"
import { Storage } from "./core/Storage"
import { Logger } from "./core/Logger"
import { Notifier } from "./core/Notifier"

const storage = new Storage()
const logger = new Logger()
const notifier = new Notifier()

const browser = await puppeteer.launch({ headless: false })
const page = await browser.newPage()

await page.setViewport({ width: 1920, height: 1080 })

for (const scraper of scrapers) {
  console.log(`${scraper.site}`)
  const isFirstRun = await storage.isFirstRun(scraper.site)
  const urls = scraper.getTargetUrls()
  const tags = scraper.getTargetTags()
  for (const [index, url] of urls.entries()) {
    console.log(`${index + 1}/${urls.length}`)
    if (index > 0) {
      console.log("small cool down")
      await new Promise<void>((resolve) => setTimeout(resolve, 2000))
    }
    await page.goto(url)
    await scraper.waitForLoad(page)
    const jobs = await scraper.listJobs(page, tags)
    console.log(`scraped ${jobs.length} job(s)`)

    const newJobs = await storage.processJobs(scraper.site, jobs, isFirstRun)
    if (newJobs.length > 0) {
      console.log(`found ${newJobs.length} new job(s)`)
      for (const job of newJobs) {
        await logger.log(scraper.site, job.url)
        await notifier.notify(scraper.site, job.url)
      }
    }
  }
}

await browser.close()
