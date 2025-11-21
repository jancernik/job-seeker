import { BaseScraper } from "../core/BaseScraper"
import { NoDeskScraper } from "../siteScrapers/NoDesk"
import { RealWorkFromAnywhereScraper } from "../siteScrapers/RealWorkFromAnywhere"
import { RemoteOkScraper } from "../siteScrapers/RemoteOk"
import { BuiltInScraper } from "../siteScrapers/BuiltIn"
import { WeWorkRemotelyScraper } from "../siteScrapers/WeWorkRemotely"
import { WorkingNomadsScraper } from "../siteScrapers/WorkingNomads"
import { RemoteRocketshipScraper } from "../siteScrapers/RemoteRocketship"
import { BrainTrustScraper } from "../siteScrapers/BrainTrust"
import { RemoteYeahScraper } from "../siteScrapers/RemoteYeah"

export const scrapers: BaseScraper[] = [
  new NoDeskScraper(),
  new RealWorkFromAnywhereScraper(),
  new RemoteOkScraper(),
  new BuiltInScraper(),
  new WeWorkRemotelyScraper(),
  new WorkingNomadsScraper(),
  new RemoteRocketshipScraper(),
  new BrainTrustScraper(),
  new RemoteYeahScraper()
]
