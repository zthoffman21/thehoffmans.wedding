export const EMAIL_SUBJECTS: Record<number, string> = {
  0: "Quick update from Avery & Zach",
  1: "You can update your RSVP until {{rsvp_deadline_short}}",
  2: "Final details for the wedding (parking, timing, map)",
  3: "Got wedding photos? We'd love to see them 📸",
  4: "Thank you for celebrating with us ❤️",
};

// 0) FALLBACK / DEFAULT (index: 0)
export function defaultTemplate(guest_name: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Update</title>
  <style>
    body{margin:0;padding:0;background:#FAF7EC;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#2b2b2b}
    .wrap{max-width:640px;margin:0 auto;background:#ffffff}
    .pad{padding:24px}
    .btn{display:inline-block;text-decoration:none;background:#1f2937;color:#ffffff;border-radius:8px;padding:12px 18px;font-weight:600}
    .muted{color:#6b7280;font-size:12px}
    .hdr{padding:20px 24px;background:#2b2b2b;color:#fff}
    h1,h2{margin:0 0 12px}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hdr">
      <h1 style="font-size:20px;">Avery & Zach — Update</h1>
    </div>
    <div class="pad">
      <p>Hi${guest_name},</p>
      <p>We wanted to share a quick update related to our wedding on <strong>July 17, 2026</strong>.</p>
      <p>If you were expecting a specific message (like an RSVP reminder, logistics, or photo upload request), don't worry, this email ensures you see the essentials even if something went off-script.</p>
      <p>
        <a class="btn" href="https://thehoffmans.wedding/info">Open Wedding Portal</a>
      </p>
      <p class="muted">Having trouble? Copy and paste this link: https://thehoffmans.wedding/info</p>
    </div>
    <div class="pad" style="border-top:1px solid #eee">
      <p class="muted">Sent by Avery & Zach • zachhoffman@ymail.com</p>
    </div>
  </div>
</body>
</html>`;
}

// 1) DEADLINE REMINDER (index: 1)
export function rsvpDeadlineReminderTemplate(guest_name: string, rsvp_deadline: string, rsvp_deadline_short: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>RSVP Deadline Reminder</title>
  <style>
    body{margin:0;padding:0;background:#FAF7EC;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#2b2b2b}
    .wrap{max-width:640px;margin:0 auto;background:#ffffff}
    .pad{padding:24px}
    .badge{display:inline-block;background:#F59E0B;color:#1f2937;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:700;letter-spacing:.02em}
    .btn{display:inline-block;text-decoration:none;background:#1f2937;color:#ffffff;border-radius:8px;padding:12px 18px;font-weight:600}
    .muted{color:#6b7280;font-size:12px}
    .hdr{padding:20px 24px;background:#2b2b2b;color:#fff}
    h1,h2{margin:0 0 12px}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hdr">
      <h1 style="font-size:20px;">RSVP updates close ${rsvp_deadline_short}</h1>
    </div>
    <div class="pad">
      <p>Hi ${guest_name},</p>
      <p>Thanks again for your RSVP for <strong>July 17, 2026</strong>! If your plans or details have changed, you can update your RSVP until:</p>
      <p><span class="badge">${rsvp_deadline} (EST)</span></p>
      <ul>
        <li>Update attendance for you or your party</li>
        <li>Add or edit dietary needs</li>
        <li>Confirm contact info in case we need to reach you</li>
      </ul>
      <p>
        <a class="btn" href="https://thehoffmans.wedding/rsvp">Review / Update RSVP</a>
      </p>
      <p class="muted">If the button doesn't work, use this link: https://thehoffmans.wedding/rsvp</p>
    </div>
    <div class="pad" style="border-top:1px solid #eee">
      <p class="muted">Sent by Avery & Zach • zachhoffman@ymail.com</p>
    </div>
  </div>
</body>
</html>`;
}

// 2) FINAL LOGISTICS (index: 2)
export function finalLogisticsTemplate(guest_name: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Final Logistics</title>
  <style>
    body{margin:0;padding:0;background:#FAF7EC;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#2b2b2b}
    .wrap{max-width:640px;margin:0 auto;background:#ffffff}
    .pad{padding:24px}
    .hdr{padding:20px 24px;background:#2b2b2b;color:#fff}
    .card{border:1px solid #eee;border-radius:12px;padding:16px;margin:12px 0}
    .btn{display:inline-block;text-decoration:none;background:#1f2937;color:#ffffff;border-radius:8px;padding:12px 18px;font-weight:600}
    .muted{color:#6b7280;font-size:12px}
    h1,h2{margin:0 0 12px}
    a{color:#1f2937}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hdr">
      <h1 style="font-size:20px;">See you soon!</h1>
    </div>
    <div class="pad">
      <p>Hi ${guest_name},</p>
      <div class="card">
        <h2 style="font-size:16px;">Times & Locations</h2>
        <p><strong>Ceremony:</strong> 5:00 PM @ Aspen & Alston</p>
        <p><strong>Reception:</strong> 7:00 PM @ Aspen & Alston</p>
        <p><a href="https://maps.app.goo.gl/aYGF4di6sTT54B8KA">Open map & directions</a></p>
      </div>
      <div class="card">
        <h2 style="font-size:16px;">Parking</h2>
        <p>Parking available on site.</p>
      </div>
      <div class="card">
        <h2 style="font-size:16px;">Dress & Weather</h2>
        <a href="https://thehoffmans.wedding/info">Full Dress Code</a>
        <p>Check the latest: <a href="https://weather.com/weather/today/l/e0e13bc9b16a240e4d81d88c11943e00ba36903c42c85457496b8e9934fa54cc">Weather in the area</a></p>
      </div>
      <p>
        <a class="btn" href="https://thehoffmans.wedding/info">View Full Itinerary</a>
      </p>
      <p class="muted">Questions? Call or text Zach at 610-507-7219.</p>
    </div>
    <div class="pad" style="border-top:1px solid #eee">
      <p class="muted">Sent by Avery & Zach • zachhoffman@ymail.com</p>
    </div>
  </div>
</body>
</html>`;
}

// 3) PHOTO UPLOAD REQUEST (index: 3)
export function photoUploadTemplate(guest_name: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Share Your Photos</title>
  <style>
    body{margin:0;padding:0;background:#FAF7EC;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#2b2b2b}
    .wrap{max-width:640px;margin:0 auto;background:#ffffff}
    .pad{padding:24px}
    .hdr{padding:20px 24px;background:#2b2b2b;color:#fff}
    .btn{display:inline-block;text-decoration:none;background:#1f2937;color:#ffffff;border-radius:8px;padding:12px 18px;font-weight:600}
    .muted{color:#6b7280;font-size:12px}
    .tip{background:#FEF3C7;border:1px solid #FDE68A;border-radius:10px;padding:12px;margin-top:10px;font-size:14px}
    h1{margin:0 0 12px}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hdr">
      <h1 style="font-size:20px;">Share your photos with us</h1>
    </div>
    <div class="pad">
      <p>Hi ${guest_name},</p>
      <p>We'd love to see the day through your lens! If you snapped any photos or videos, please add them to our guest gallery.</p>
      <p>
        <a class="btn" href="https://thehoffmans.wedding/gallery">Upload to the Gallery</a>
      </p>
      <p class="muted">If the button doesn't work, use this link: https://thehoffmans.wedding/gallery</p>
    </div>
    <div class="pad" style="border-top:1px solid #eee">
      <p class="muted">Sent by Avery & Zach • zachhoffman@ymail.com</p>
    </div>
  </div>
</body>
</html>`;
}

// 4) THANK YOU (index: 4)
export function thankYouTemplate(guest_name: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Thank You</title>
  <style>
    body{margin:0;padding:0;background:#FAF7EC;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#2b2b2b}
    .wrap{max-width:640px;margin:0 auto;background:#ffffff}
    .pad{padding:24px}
    .hdr{padding:20px 24px;background:#2b2b2b;color:#fff}
    .btn{display:inline-block;text-decoration:none;background:#1f2937;color:#ffffff;border-radius:8px;padding:12px 18px;font-weight:600}
    .muted{color:#6b7280;font-size:12px}
    .cards{display:block}
    .card{border:1px solid #eee;border-radius:12px;padding:16px;margin:12px 0}
    h1,h2{margin:0 0 12px}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hdr">
      <h1 style="font-size:20px;">Thank you</h1>
    </div>
    <div class="pad">
      <p>Hi ${guest_name},</p>
      <p>We're so grateful you could be part of our day. Thank you for the love, laughs, and memories!</p>
      <div class="cards">
        {{#if album_link}}
        <div class="card">
          <h2 style="font-size:16px;">Photo Gallery</h2>
          <p>Highlights and guest uploads are collected here.</p>
          <p><a class="btn" href="https://thehoffmans.wedding/gallery">View Photos</a></p>
        </div>
      </div>
      <p class="muted">If the button doesn't work, use this link: https://thehoffmans.wedding/gallery</p>
    </div>
    <div class="pad" style="border-top:1px solid #eee">
      <p class="muted">With love, Avery & Zach • zachhoffman@ymail.com</p>
    </div>
  </div>
</body>
</html>`;
}