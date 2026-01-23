import React, { useState, useEffect } from "react"
import { Box, Text, useInput, useStdout } from "ink"
import Link from "ink-link"
import { exec } from "child_process"
import { StoredJobListing } from "../core/types"
import { colors } from "./colors"

type UnseenJobsUIProps = {
  jobs: StoredJobListing[]
  onMarkAsSeen: (jobId: string) => void
  availableHeight: number
}

const LINES_PER_CARD = 6
const HEADER_LINES = 5
const SCROLL_INDICATOR_LINES = 4

export const UnseenJobsUI: React.FC<UnseenJobsUIProps> = ({
  jobs,
  onMarkAsSeen,
  availableHeight
}) => {
  const { stdout } = useStdout()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const terminalWidth = stdout.columns || 80
  const urlMaxWidth = Math.max(30, terminalWidth - 12)
  const maxVisibleCards = Math.max(
    1,
    Math.floor((availableHeight - HEADER_LINES - SCROLL_INDICATOR_LINES) / LINES_PER_CARD)
  )
  const startIndex = Math.max(
    0,
    Math.min(selectedIndex - maxVisibleCards + 1, jobs.length - maxVisibleCards)
  )
  const visibleJobs = jobs.slice(startIndex, startIndex + maxVisibleCards)

  const truncateUrl = (url: string, maxWidth: number): string => {
    if (url.length <= maxWidth) return url
    return url.substring(0, maxWidth - 3) + "..."
  }

  const getHostname = (url: string, fallback: string): string => {
    try {
      return new URL(url).hostname.replace("www.", "")
    } catch {
      return fallback
    }
  }

  const openUrl = (url: string) => {
    const command =
      process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open"
    exec(`${command} "${url}"`)
  }

  useEffect(() => {
    if (selectedIndex >= jobs.length && jobs.length > 0) {
      setSelectedIndex(jobs.length - 1)
    }
  }, [jobs.length, selectedIndex])

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      process.emit("SIGINT" as any)
      return
    }
    if (key.upArrow && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1)
    } else if (key.downArrow && selectedIndex < jobs.length - 1) {
      setSelectedIndex(selectedIndex + 1)
    } else if (key.return && jobs[selectedIndex]) {
      openUrl(jobs[selectedIndex].url)
    } else if (
      (key.delete || key.backspace || input === "d" || input === "x") &&
      jobs[selectedIndex]
    ) {
      onMarkAsSeen(jobs[selectedIndex].id)
    }
  })

  if (jobs.length === 0) {
    return (
      <Box borderStyle="round" borderColor={colors.gray[800]} paddingX={1}>
        <Box flexDirection="column" width="100%">
          <Box>
            <Text color={colors.gray[50]} bold>
              No Unseen Jobs
            </Text>
          </Box>
          <Box>
            <Text color={colors.gray[500]}>All caught up! No new jobs to review.</Text>
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <Box borderStyle="round" borderColor={colors.accent.purple} paddingX={1}>
      <Box flexDirection="column" width="100%">
        <Box>
          <Text color={colors.accent.purple} bold>
            Unseen Jobs
          </Text>
          <Text color={colors.gray[300]}> ({jobs.length} new)</Text>
        </Box>
        <Box marginTop={1}>
          <Text color={colors.gray[500]}>Use </Text>
          <Text color={colors.gray[100]} bold>
            ↑/↓
          </Text>
          <Text color={colors.gray[500]}> to navigate, </Text>
          <Text color={colors.gray[100]} bold>
            Enter
          </Text>
          <Text color={colors.gray[500]}> to open, </Text>
          <Text color={colors.gray[100]} bold>
            Del
          </Text>
          <Text color={colors.gray[500]}> to dismiss</Text>
        </Box>

        {startIndex > 0 && (
          <Box marginTop={1}>
            <Text color={colors.gray[600]}>↑ </Text>
            <Text color={colors.gray[200]} bold>
              {startIndex}
            </Text>
            <Text color={colors.gray[600]}> above</Text>
          </Box>
        )}

        {visibleJobs.map((job, index) => {
          const actualIndex = startIndex + index
          const isSelected = actualIndex === selectedIndex
          const date = new Date(job.date)
          const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          const timeStr = date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
          })
          const siteName = getHostname(job.url, job.id.split("-")[0] || "Unknown")

          return (
            <Box
              key={job.id}
              flexDirection="column"
              marginTop={1}
              borderStyle="round"
              borderColor={isSelected ? colors.accent.purple : colors.gray[800]}
              paddingX={1}
            >
              <Box>
                <Text color={isSelected ? colors.gray[50] : colors.gray[200]} bold>
                  {siteName}
                </Text>
                <Text color={colors.gray[600]}> • </Text>
                <Text color={isSelected ? colors.accent.purple : colors.gray[400]}>{dateStr}</Text>
                <Text color={colors.gray[600]}> at </Text>
                <Text color={isSelected ? colors.accent.purple : colors.gray[400]}>{timeStr}</Text>
              </Box>
              <Box>
                <Text color={colors.gray[500]}>Job: </Text>
                <Link url={job.url}>
                  <Text color={isSelected ? colors.gray[50] : colors.gray[200]} underline>
                    {truncateUrl(job.url, urlMaxWidth - 5)}
                  </Text>
                </Link>
              </Box>
              <Box>
                <Text color={colors.gray[500]}>From: </Text>
                <Link url={job.source}>
                  <Text color={isSelected ? colors.gray[100] : colors.gray[300]} underline>
                    {truncateUrl(job.source, urlMaxWidth - 6)}
                  </Text>
                </Link>
              </Box>
            </Box>
          )
        })}

        {startIndex + maxVisibleCards < jobs.length && (
          <Box marginTop={1}>
            <Text color={colors.gray[600]}>↓ </Text>
            <Text color={colors.gray[200]} bold>
              {jobs.length - startIndex - maxVisibleCards}
            </Text>
            <Text color={colors.gray[600]}> more below</Text>
          </Box>
        )}
      </Box>
    </Box>
  )
}
