export default {
  async scheduled() {
    const r = await fetch("https://thehoffmans.wedding/api/admin/reminders", {
      method: "POST",
    });
    console.log("reminders/run ->", r.status);
  },
};
