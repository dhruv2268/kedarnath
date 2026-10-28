/* =============================================================
   Our route (from Google Maps):
   Gandhinagar → Haridwar → Gaurikund (Kedarnath) → Chopta (Tungnath)
   → Dehradun → Mussoorie → Delhi → Kota → Gandhinagar
   ~3,023 km · ~59 hours of driving (Google Maps). Day splits are editable.
   ============================================================= */
window.ROUTE = {
  id: "main",
  name: "Gandhinagar → Kedarnath → Chopta → Mussoorie → Gandhinagar",
  googleKm: 3023,
  googleHrs: 59,
  stops: ["Gandhinagar", "Haridwar", "Gaurikund", "Chopta Tungnath", "Dehradun", "Mussoorie", "Delhi", "Kota", "Gandhinagar"],
  mapsUrl: "https://www.google.com/maps/dir/Gandhinagar,+Gujarat/Haridwar,+Uttarakhand/Gaurikund,+Uttarakhand/Chopta,+Uttarakhand/Dehradun,+Uttarakhand/Mussoorie,+Uttarakhand/Delhi/Kota,+Rajasthan/Gandhinagar,+Gujarat",
  legs: [
    { title: "Gandhinagar to Jaipur", from: "Gandhinagar", to: "Jaipur", km: 620, hrs: 11, stops: "Via Ahmedabad–Udaipur highway, Udaipur, Ajmer. Leave early; tolls on this stretch." },
    { title: "Jaipur to Haridwar", from: "Jaipur", to: "Haridwar", km: 480, hrs: 9, stops: "Via Delhi (Eastern Peripheral Expressway), Meerut, Roorkee. Har Ki Pauri Ganga aarti if you arrive by evening." },
    { title: "Into the mountains", from: "Haridwar", to: "Gaurikund", km: 240, hrs: 9, stops: "Rishikesh, Devprayag, Srinagar, Rudraprayag, Guptkashi. Park at Sonprayag; shuttle to Gaurikund. Stay at Sonprayag / Gaurikund." },
    { title: "Trek to Kedarnath · night at Kedarnath", from: "Gaurikund", to: "Kedarnath", km: 16, hrs: 7, stops: "Start by 5–6 AM (on foot / pony / palki). Evening aarti at Kedarnath. Our ONE night at Kedarnath — it is below freezing at night." },
    { title: "Kedarnath darshan · descend to Ukhimath", from: "Kedarnath", to: "Ukhimath", km: 40, hrs: 8, stops: "Early-morning darshan, Bhairavnath temple, trek down to Gaurikund, drive to Ukhimath (Omkareshwar temple — Kedarnath ji's winter seat). Diwali night." },
    { title: "Chopta · Tungnath & Chandrashila", from: "Ukhimath", to: "Chopta", km: 30, hrs: 1, stops: "Trek 3.5 km to Tungnath, 1.5 km more to Chandrashila peak. Note: Tungnath temple doors close for winter on 6 Nov, so the temple will be shut; Tungnath ji's winter seat is Markandeya temple, Makkumath. Night at Chopta." },
    { title: "Chopta to Dehradun", from: "Chopta", to: "Dehradun", km: 230, hrs: 8, stops: "Via Rudraprayag, Devprayag, Rishikesh (Laxman Jhula / Ram Jhula stop)." },
    { title: "Dehradun & up to Mussoorie", from: "Dehradun", to: "Mussoorie", km: 35, hrs: 1.5, stops: "Tapkeshwar Mahadev temple, Sahastradhara, Robber's Cave. Drive up to Mussoorie by evening." },
    { title: "Mussoorie day", from: "Mussoorie", to: "Mussoorie", km: 25, hrs: 0, stops: "Kempty Falls, Mall Road, Gun Hill ropeway, Lal Tibba, Camel's Back Road." },
    { title: "Mussoorie to Delhi", from: "Mussoorie", to: "Delhi", km: 290, hrs: 7, stops: "Via Dehradun–Delhi expressway. Evening free in Delhi." },
    { title: "Delhi to Kota", from: "Delhi", to: "Kota", km: 480, hrs: 7, stops: "Delhi–Mumbai Expressway. Chambal Riverfront in the evening." },
    { title: "Kota to home", from: "Kota", to: "Gandhinagar", km: 540, hrs: 10, stops: "Via Chittorgarh and Udaipur. Home!" }
  ]
};

const ROUTE_FIELDS = ["title", "from", "to", "km", "hrs", "stops"];

window.Routes = {
  async get() {
    const saved = await DB.get("route-main");
    return Object.assign({}, ROUTE, saved && saved.legs ? { legs: saved.legs } : {});
  },
  async saveLegs(legs) { await DB.put("route", { legs }, "route-main"); },
  // Day plan = the route leg for that day + anything the family added/edited in the Plan page.
  // (Nothing is copied, so a new phone can never overwrite another phone's hotels.)
  async plans() {
    const r = await this.get();
    const saved = {}; (await DB.all("plan")).forEach(p => saved[p.date] = p);
    const out = {};
    App.tripDays().forEach((d, i) => {
      const leg = r.legs[i] || {};
      let s = saved[d.date] || {};
      if (s.v !== 2) { s = Object.assign({}, s); ROUTE_FIELDS.forEach(k => delete s[k]); } // ignore route text from the old plan
      out[d.date] = Object.assign({ date: d.date }, leg, s);
    });
    return out;
  }
};
