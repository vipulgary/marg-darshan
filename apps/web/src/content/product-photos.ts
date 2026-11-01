/**
 * Product photos from Wikimedia Commons (free licences). Attribution is required for CC BY / BY-SA
 * and is shown under each photo. Replace with the client's own product photos before launch.
 */
export interface PhotoCredit {
  src: string;
  width: number;
  height: number;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
}

export const PRODUCT_PHOTOS: Record<string, PhotoCredit> = {
  "yellow-sapphire-pukhraj": {
    "src": "/images/shop/yellow-sapphire-pukhraj.jpg",
    "width": 960,
    "height": 643,
    "author": "Gemsphoto",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Yellow_sapphire_oval_gemstone.JPG"
  },
  "blue-sapphire-neelam": {
    "src": "/images/shop/blue-sapphire-neelam.jpg",
    "width": 960,
    "height": 720,
    "author": "gemteck1 from Seattle, Washington, USA",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Ceylon_Sapphire_ring.jpg"
  },
  "ruby-manik": {
    "src": "/images/shop/ruby-manik.jpg",
    "width": 960,
    "height": 849,
    "author": "Unknown",
    "license": "Public domain",
    "licenseUrl": "",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Cut_Ruby.jpg"
  },
  "emerald-panna": {
    "src": "/images/shop/emerald-panna.jpg",
    "width": 960,
    "height": 817,
    "author": "Gems International",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Natural_Pear_Cut_Zambian_Emerald_Gemstone.jpg"
  },
  "panchmukhi-rudraksha": {
    "src": "/images/shop/panchmukhi-rudraksha.jpg",
    "width": 960,
    "height": 1280,
    "author": "Gaurav Dhwaj Khadka",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Rudraksha_Bead.jpg"
  },
  "shri-yantra": {
    "src": "/images/shop/shri-yantra.jpg",
    "width": 960,
    "height": 941,
    "author": "Ranjithsiji",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Sree_Chakram.JPG"
  }
};
