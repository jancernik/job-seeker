import React, { useState, useEffect } from "react"
import { Box, Text, render, useStdout, useInput } from "ink"
import { StoredJobListing } from "../core/types"
import { UnseenJobsUI } from "./UnseenJobsUI"
import { colors } from "./colors"

export type ScraperStatus = {
  mode: "idle" | "scraping"
  currentSite: string
  currentUrl: number
  totalUrls: number
  jobsScraped: number
  newJobsFound: number
  status: string
  nextScrapeIn?: number
  lastScrapeTime?: string
  totalSitesScraped?: number
  currentSiteIndex?: number
  runNumber?: number
  scrapeStartTime?: number
}

type ScraperUIProps = {
  onStatusUpdate: (updateFn: React.Dispatch<React.SetStateAction<ScraperStatus>>) => void
  unseenJobs: StoredJobListing[]
  onMarkAsSeen: (jobId: string) => void
  onManualRun: () => void
}

const ScraperUI: React.FC<ScraperUIProps> = ({
  onStatusUpdate,
  unseenJobs,
  onMarkAsSeen,
  onManualRun
}) => {
  const { stdout } = useStdout()
  const [status, setStatus] = useState<ScraperStatus>({
    mode: "idle",
    currentSite: "",
    currentUrl: 0,
    totalUrls: 0,
    jobsScraped: 0,
    newJobsFound: 0,
    status: "Initializing...",
    runNumber: 0
  })
  const [terminalWidth, setTerminalWidth] = useState(stdout.columns || 80)
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    onStatusUpdate(setStatus)
  }, [onStatusUpdate])

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      process.emit("SIGINT" as any)
      return
    }
    if (input === "r" && status.mode === "idle") {
      onManualRun()
    }
  })

  useEffect(() => {
    const handleResize = () => {
      process.stdout.write("\x1Bc")
      setTerminalWidth(stdout.columns || 80)
    }
    stdout.on("resize", handleResize)
    return () => {
      stdout.off("resize", handleResize)
    }
  }, [stdout])

  useEffect(() => {
    if (status.mode === "scraping" && status.scrapeStartTime) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - status.scrapeStartTime!) / 1000))
      }, 1000)
      return () => clearInterval(interval)
    }
    setElapsedTime(0)
  }, [status.mode, status.scrapeStartTime])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const progressPercentage =
    status.totalUrls > 0 ? Math.round((status.currentUrl / status.totalUrls) * 100) : 0
  const progressBarWidth = 15
  const filledWidth = Math.round((progressPercentage / 100) * progressBarWidth)
  const progressBar = "█".repeat(filledWidth) + "░".repeat(progressBarWidth - filledWidth)

  return (
    <Box flexDirection="column" width={terminalWidth}>
      <Box
        borderStyle="round"
        borderColor={status.mode === "scraping" ? colors.accent.orange : colors.gray[800]}
        paddingX={1}
      >
        <Box flexDirection="column" width="100%">
          <Box>
            <Text color={status.mode === "scraping" ? colors.accent.orange : colors.gray[100]} bold>
              {status.mode === "scraping" ? "Scraping" : "Idle"}
            </Text>
            <Text color={colors.gray[700]}> · </Text>
            <Text color={colors.gray[500]}>Run </Text>
            <Text color={colors.gray[200]}>#{status.runNumber || 0}</Text>
            <Text color={colors.gray[700]}> · </Text>
            <Text color={colors.gray[500]}>Scraped </Text>
            <Text color={colors.gray[100]}>{status.jobsScraped}</Text>
            <Text color={colors.gray[700]}> · </Text>
            <Text color={colors.gray[500]}>New </Text>
            <Text color={status.newJobsFound > 0 ? colors.accent.green : colors.gray[200]}>
              {status.newJobsFound}
            </Text>
            {status.lastScrapeTime && (
              <>
                <Text color={colors.gray[700]}> · </Text>
                <Text color={colors.gray[500]}>Last </Text>
                <Text color={colors.gray[400]}>{status.lastScrapeTime}</Text>
              </>
            )}
            {status.mode === "idle" && (
              <>
                <Text color={colors.gray[700]}> · </Text>
                <Text color={colors.gray[500]}>Next </Text>
                <Text color={colors.gray[100]} bold>
                  {status.nextScrapeIn !== undefined ? formatTime(status.nextScrapeIn) : "--:--"}
                </Text>
              </>
            )}
          </Box>
          <Box>
            {status.mode === "idle" ? (
              <>
                <Text color={colors.gray[600]}>Press </Text>
                <Text color={colors.gray[400]}>r</Text>
                <Text color={colors.gray[600]}> to run now</Text>
              </>
            ) : (
              <>
                <Text color={colors.gray[50]} bold>
                  {status.currentSite || "Starting..."}
                </Text>
                {status.currentSiteIndex !== undefined &&
                  status.totalSitesScraped !== undefined && (
                    <Text color={colors.gray[500]}>
                      {" "}
                      ({status.currentSiteIndex}/{status.totalSitesScraped})
                    </Text>
                  )}
                <Text color={colors.gray[700]}> </Text>
                <Text color={colors.gray[600]}>{progressBar}</Text>
                <Text color={colors.gray[700]}> </Text>
                <Text color={colors.gray[200]}>
                  {status.currentUrl}/{status.totalUrls}
                </Text>
                <Text color={colors.gray[700]}> · </Text>
                <Text color={colors.gray[100]}>{progressPercentage}%</Text>
                <Text color={colors.gray[700]}> · </Text>
                <Text color={colors.gray[200]}>{formatTime(elapsedTime)}</Text>
              </>
            )}
          </Box>
        </Box>
      </Box>
      <UnseenJobsUI jobs={unseenJobs} onMarkAsSeen={onMarkAsSeen} />
    </Box>
  )
}

export type UpdateStatusFn = (status: Partial<ScraperStatus>) => void

type CreateScraperUIOptions = {
  unseenJobs: StoredJobListing[]
  onMarkAsSeen: (jobId: string) => void
  onManualRun: () => void
}

export const createScraperUI = ({
  unseenJobs,
  onMarkAsSeen,
  onManualRun
}: CreateScraperUIOptions) => {
  let updateStatus: UpdateStatusFn

  const onStatusUpdate = (setStatus: React.Dispatch<React.SetStateAction<ScraperStatus>>) => {
    updateStatus = (partialStatus: Partial<ScraperStatus>) => {
      setStatus((prev: ScraperStatus) => ({ ...prev, ...partialStatus }))
    }
  }

  process.stdout.write("\x1Bc")

  const { unmount, waitUntilExit, clear, rerender } = render(
    <ScraperUI
      onStatusUpdate={onStatusUpdate}
      unseenJobs={unseenJobs}
      onMarkAsSeen={onMarkAsSeen}
      onManualRun={onManualRun}
    />,
    { patchConsole: true, exitOnCtrlC: false }
  )

  return {
    updateStatus: (status: Partial<ScraperStatus>) => {
      if (updateStatus) updateStatus(status)
    },
    updateUnseenJobs: (jobs: StoredJobListing[]) => {
      rerender(
        <ScraperUI
          onStatusUpdate={onStatusUpdate}
          unseenJobs={jobs}
          onMarkAsSeen={onMarkAsSeen}
          onManualRun={onManualRun}
        />
      )
    },
    unmount,
    waitUntilExit,
    clear
  }
}
