# Travellers Family: Annual Trip 2 (part of the 'O' Trip)

**Kedarnath · Chopta · Mussoorie, 4–15 November 2026, by car**

Route: Gandhinagar → Haridwar → Gaurikund (Kedarnath, 1 night) → Chopta Tungnath → Dehradun → Mussoorie → Delhi → Kota → Gandhinagar. That's about 3,023 km and about 59 hours of driving.

**Pages:** Today (home) · Plan · Expenses · Route & drive log · Journal · Settings

---

## Try it on your laptop first
Unzip, then right-click `index.html` → **Open with → Google Chrome** (or Edge). Press F12, then Ctrl+Shift+M to see it at phone size.
To see the before / during / after home screens, go to **Settings → Preview mode**.
To clear test data, go to **F12 → Application → Storage → Clear site data**.

## Step 1: Put it online with Netlify (about 2 minutes)
1. Open **https://app.netlify.com/drop** and sign in (a free account is fine).
2. Drag the unzipped **`travellers-family-trip-2` folder** onto the page.
3. Netlify gives you a link. Open it on your phone, then add it to the home screen:
   - Android (Chrome): **⋮ → Add to Home screen**
   - iPhone (Safari): **Share → Add to Home Screen**
4. *(Optional)* To pick a nicer link, go to **Site configuration → Change site name**.

## Step 2: Share data across all 3 phones (one time, about 10 minutes)
1. Go to **https://supabase.com**, sign up for free, and click **New project**. Choose the region **Mumbai**.
2. Open `setup.sql` in Notepad. On **line 21**, replace `CHANGE-ME-family-key` with your own secret (your **family trip key**).
3. In Supabase, open **SQL Editor → New query**, paste the whole of `setup.sql`, and click **Run**.
4. In Supabase, open **Project Settings → API Keys**. Copy the **Project URL** and the **Publishable key** (or the legacy anon key).
5. Paste both values into `config.js`, then drag the folder onto Netlify **Deploys** again.
   *Or skip editing `config.js`:* on your phone, go to **Settings → Family sync** and type the URL, key and trip key there.
6. On your phone, go to **Settings → Share with family** and send the link on WhatsApp. Opening the link connects the other phones automatically.

Without the trip key, nobody can read or change the data, even if they have the website link.

## Test no-network mode (after Netlify)
1. Open the site once while you're online.
2. Switch on **Airplane mode**, then open it from the home screen and add an expense. The chip at the top should say **"Offline · saved"**.
3. Switch Airplane mode off. The chip changes to **"Synced"** within a few seconds.

Open the Journal map around Kedarnath and Chopta once while you have signal, so those map tiles are saved for later.

---

## Important for this trip
- **Kedarnath doors close Wed 11 Nov** (Bhai Dooj). The plan has the trek on **Sat 7 Nov**, one night at Kedarnath, and darshan on the morning of 8 Nov.
- **Tungnath temple doors close on 6 Nov**, before you reach Chopta. The Tungnath and Chandrashila trek stays open, but the temple will be shut. Tungnath ji's winter darshan is at Markandeya temple, Makkumath.
- **Diwali is on Sun 8 Nov** (the plan has you at Ukhimath that night). Nights at Kedarnath and Chopta are below 0 °C.
- Day distances are approximate. You can edit any day under **Route** or **Plan**.

## Updating the site later
Edit the files, change the `VERSION` in `sw.js` (e.g. `family-trip2-v3`), and drag the folder onto Netlify **Deploys** again.

Har Har Mahadev 🙏
