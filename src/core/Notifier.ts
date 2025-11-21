import notifier from "node-notifier"

export class Notifier {
  async notify(site: string, url: string): Promise<void> {
    notifier.notify({
      title: "New Job Found!",
      message: `${site}\n${url}`,
      sound: true,
      wait: false
    })
  }
}
