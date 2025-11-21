import fs from "fs-extra"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const configPath = path.join(__dirname, "../../config.json")

if (!(await fs.pathExists(configPath))) {
  console.error("Error: config.json not found")
  process.exit(1)
}

const config = await fs.readJson(configPath)
export const urls: string[] = config.urls
export const tags: Record<string, string[]> = (config.tags = config.tags)
