// Paste this in Chrome's Console while on booking.com (View > Developer > JavaScript Console).
// It reads the main photo of each hotel and downloads hotelPhotos.json. Move that file to lib/hotelPhotos.json.
(async () => {
  const slugs = ["address-jabal-omar-makkah", "ajyad-makkah-makarim", "al-ansar-golden-tulip", "al-eman-royal", "al-kiswah-towers", "al-madina-arac-inn", "al-majeedi-arac-suites", "al-manakha-rotana-madinah-madinah", "al-safwah", "anwar-al-madinah-movenpick", "artal-international", "byst-wystrn-mk-lmkrm-mk-lmkrm", "coral-madinah", "dar-al-eiman-grand", "dar-al-ghufran-makkah", "dar-al-hijra-intercontinental", "dar-al-iman-intercontinental", "diwan-al-bait", "doubletree-by-hilton-makkah-jabal-omar", "dyar-international", "elaf-ajyad-makkah", "elaf-taiba", "fndq-wqf-thmn-bn-fn", "golden-tulip-al-zahabi", "hayatt-international", "hilton-makkah-convention", "holiday-inn-makkah-al-aziziah", "holiday-suites-al-aziziah", "holiday-villa-madinah", "hyatt-regency-makkah", "ibis-styles-makkah", "jabal-omar-jumeirah-makkah", "le-meridien-madina", "m-makkah-by-millennium", "madinah-hilton", "makkah-clock-royal-tower-a-fairmont", "makkah-hotel", "makkah-marriott", "makkah-towers", "mawadah-al-salwa", "maysan-al-maqam", "millennium-al-aqeeq-madinah-hotel", "millennium-taibah", "mokhtara-international", "movenpick-residence-hajar-tower-makkah", "novotel-makkah-thaker-city", "odst-al-madinah", "palestine-makkah", "pullman-zamzam-madina", "ramada-by-wyndham-makkah-zad-al-tayseer", "royal-dar-al-eiman", "shahd-al-madina-managed-by-accor", "swissotel-al-maqam-makkah", "swissotel-makkah", "voco-makkah", "western-alharithia-madina", "zamzam-grand-suites-managed-by-pullman", "zowar-international"]
  const out = {}
  for (const s of slugs) {
    try {
      const h = await (await fetch(`/hotel/sa/${s}.html`)).text()
      let u = (h.match(/property="og:image"\s+content="([^"]+)"/) || h.match(/content="([^"]+)"\s+property="og:image"/) || [])[1]
        || (h.match(/https:\/\/cf\.bstatic\.com\/xdata\/images\/hotel\/max[0-9x]+\/[^"'\s)]+/) || [])[0]
      if (u) {
        u = u.replace(/&amp;/g, "&").replace(/\/max\d+(x\d+)?\//, "/max1024x768/")
        out[s] = u
        console.log("✓", s)
      } else console.log("✗", s)
    } catch (e) { console.log("✗", s, e) }
    await new Promise(r => setTimeout(r, 500))
  }
  const a = document.createElement("a")
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" }))
  a.download = "hotelPhotos.json"
  a.click()
  console.log("Done:", Object.keys(out).length, "photos")
})()
