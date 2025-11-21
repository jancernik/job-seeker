import fs from "fs-extra"
import path from "path"

export class Logger {
  private logFile: string

  constructor(logFile = "./logs/jobs.log") {
    this.logFile = logFile
  }

  private async ensureLogDir(): Promise<void> {
    const logDir = path.dirname(this.logFile)
    await fs.ensureDir(logDir)
  }

  async log(site: string, jobUrl: string, source: string): Promise<void> {
    await this.ensureLogDir()
    const timestamp = new Date().toISOString()
    const line = `${timestamp}\nSite: ${site}\nLink: ${jobUrl}\nFrom: ${source}\n\n`
    await fs.appendFile(this.logFile, line)
  }
}
