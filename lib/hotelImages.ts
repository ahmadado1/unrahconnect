import { brandFavicon } from "./restaurantImages"

/** Ultimate fallback — Abraj Al-Bait / Clock Tower complex exterior */
export const HOTEL_IMAGE_PLACEHOLDER =
  "https://upload.wikimedia.org/wikipedia/commons/4/4a/Abraj-al-Bait_largest_clock_tower_in_the_world.jpg"

/** Brand logos for hotels without a verified property exterior photo */
export const HOTEL_BRAND_LOGOS = {
  fairmont:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Fairmont_Logo.svg/330px-Fairmont_Logo.svg.png",
  marriott:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Marriott_Logo.svg/330px-Marriott_Logo.svg.png",
  hilton:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Hilton_Worldwide_logo.svg/330px-Hilton_Worldwide_logo.svg.png",
  hyatt:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Hyatt_Logo.svg/330px-Hyatt_Logo.svg.png",
  sheraton:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Sheraton_%281%29.svg/330px-Sheraton_%281%29.svg.png",
  pullman:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Pullman_logo_2013.svg/330px-Pullman_logo_2013.svg.png",
  swissotel:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Swissotel_Hotels_and_Resorts_logo.svg/330px-Swissotel_Hotels_and_Resorts_logo.svg.png",
  radissonBlu:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Radisson_Blu_logo.svg/330px-Radisson_Blu_logo.svg.png",
  ihg: brandFavicon("ihg.com"),
  movenpick: brandFavicon("movenpick.com"),
  raffles: brandFavicon("raffles.com"),
  conrad: brandFavicon("conradhotels.com"),
  leMeridien: brandFavicon("lemeridien.com"),
  rotana: brandFavicon("rotana.com"),
  oberoi: brandFavicon("oberoihotels.com"),
  millennium: brandFavicon("millenniumhotels.com"),
  elaf: brandFavicon("elafgroup.com"),
  elafTaiba:
    "https://image-tc.galaxy.tf/wipng-xqjlvsdx656ww6ehcye8874j/elaf-taiba.png?width=500",
  anjum: brandFavicon("anjumhotels.com"),
  shaza: brandFavicon("www.shazahotels.com"),
  dallah: brandFavicon("www.dallahhotels.com"),
  accor: brandFavicon("accor.com"),
  jumeirah: brandFavicon("jumeirah.com"),
  alSafwah:
    "https://alsafwahorchid.com.sa/public/uploads/settings/company_logo.png",
  mawaddah: brandFavicon("mawaddah.com"),
  generic: brandFavicon("booking.com"),
} as const
