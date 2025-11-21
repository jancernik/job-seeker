export type JobListing = {
  id: string
  url: string
  source: string
}

export type StoredJobListing = JobListing & {
  date: string
  seen: boolean
}
