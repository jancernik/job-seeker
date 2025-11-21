export type JobListing = {
  id: string
  url: string
}

export type StoredJobListing = JobListing & {
  date: string
}
