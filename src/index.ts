import puppeteer from "puppeteer"
import { scrapers } from "./core/scrapers"
import { Storage } from "./core/Storage"
import { Logger } from "./core/Logger"
import { Notifier } from "./core/Notifier"
import { Screenshots } from "./core/Screenshots"
import { createScraperUI } from "./ui/ScraperUI"

const storage = new Storage()
const logger = new Logger()
const notifier = new Notifier()
const screenshots = new Screenshots()

let manualRunResolve: (() => void) | null = null
let sessionJobsScraped = 0
let sessionNewJobsFound = 0
let runNumber = 0

const refreshUnseenJobs = async () => {
  const unseenJobs = await storage.getUnseenJobs()
  ui.updateUnseenJobs(unseenJobs)
}

const handleMarkAsSeen = async (jobId: string) => {
  await storage.markAsSeen(jobId)
  await refreshUnseenJobs()
}

const handleTriggerManualRun = () => {
  if (manualRunResolve) {
    manualRunResolve()
    manualRunResolve = null
  }
}

const ui = createScraperUI({
  unseenJobs: [],
  onMarkAsSeen: handleMarkAsSeen,
  onManualRun: handleTriggerManualRun
})

const getRandomInterval = (): number => {
  const baseInterval = 30 * 60 * 1000
  const variance = 5 * 60 * 1000
  return baseInterval + (Math.random() * variance * 2 - variance)
}

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const countdown = async (totalSeconds: number): Promise<void> => {
  return new Promise((resolve) => {
    let remaining = totalSeconds
    manualRunResolve = resolve

    const tick = () => {
      if (remaining <= 0 || manualRunResolve === null) {
        manualRunResolve = null
        resolve()
        return
      }

      ui.updateStatus({
        mode: "idle",
        nextScrapeIn: remaining,
        jobsScraped: sessionJobsScraped,
        newJobsFound: sessionNewJobsFound
      })

      remaining--
      setTimeout(tick, 1000)
    }

    tick()
  })
}

const runScraper = async (): Promise<void> => {
  runNumber++
  const scrapeStartTime = Date.now()

  await screenshots.ensureDir()

  ui.updateStatus({
    mode: "scraping",
    status: "Launching browser...",
    runNumber,
    scrapeStartTime
  })

  let browser
  try {
    browser = await puppeteer.launch({ headless: false })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    ui.updateStatus({
      mode: "idle",
      status: `Browser launch failed: ${errorMsg.slice(0, 40)}`
    })
    return
  }

  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })

  let scrapeJobsScraped = 0
  let scrapeNewJobsFound = 0

  try {
    for (const [scraperIndex, scraper] of scrapers.entries()) {
      const isFirstRun = await storage.isFirstRun(scraper.site)
      const urls = scraper.getTargetUrls()
      const tags = scraper.getTargetTags()

      ui.updateStatus({
        currentSite: scraper.site,
        totalUrls: urls.length,
        currentUrl: 0,
        currentSiteIndex: scraperIndex + 1,
        totalSitesScraped: scrapers.length,
        status: `Starting ${scraper.site}...`
      })

      for (const [index, url] of urls.entries()) {
        ui.updateStatus({
          currentUrl: index + 1,
          status: `Scraping ${scraper.site}...`
        })

        if (index > 0) {
          ui.updateStatus({ status: "Cooling down..." })
          await sleep(2000)
        }

        try {
          await page.goto(url, { timeout: 30000 })
          await scraper.waitForLoad(page)

          if (page.url() !== url) continue

          await screenshots.capture(page, scraper.site)

          const jobs = await scraper.listJobs(page, tags)

          scrapeJobsScraped += jobs.length
          sessionJobsScraped += jobs.length

          ui.updateStatus({
            jobsScraped: sessionJobsScraped,
            status: `Found ${jobs.length} job(s)`
          })

          const newJobs = await storage.getNewJobs(scraper.site, jobs, isFirstRun)
          if (newJobs.length > 0) {
            scrapeNewJobsFound += newJobs.length
            sessionNewJobsFound += newJobs.length

            ui.updateStatus({
              newJobsFound: sessionNewJobsFound,
              status: `Processing ${newJobs.length} new job(s)...`
            })

            for (const job of newJobs) {
              await logger.log(scraper.site, job.url, job.source)
              await notifier.notify(scraper.site, job.url)
            }

            await refreshUnseenJobs()
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          ui.updateStatus({ status: `Error: ${errorMsg.slice(0, 50)}...` })
          await sleep(1000)
        }
      }
    }
  } finally {
    ui.updateStatus({ status: "Closing browser..." })
    await browser.close()
  }

  const timeString = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })

  ui.updateStatus({
    mode: "idle",
    lastScrapeTime: timeString,
    status: `Completed. Scraped ${scrapeJobsScraped} jobs, found ${scrapeNewJobsFound} new.`,
    runNumber
  })
}

const main = async () => {
  ui.updateStatus({ mode: "idle", status: "Starting..." })
  await refreshUnseenJobs()

  const unseenJobsInterval = setInterval(refreshUnseenJobs, 5000)

  try {
    while (true) {
      await runScraper()
      const nextIntervalSeconds = Math.floor(getRandomInterval() / 1000)
      ui.updateStatus({ status: "Waiting for next run..." })
      await countdown(nextIntervalSeconds)
    }
  } finally {
    clearInterval(unseenJobsInterval)
  }
}

process.on("SIGINT", () => {
  ui.unmount()
  process.stdout.write("\x1Bc")
  process.exit(0)
})

main().catch((error) => {
  ui.clear()
  ui.unmount()
  console.error("Fatal error:", error)
  process.exit(1)
})
