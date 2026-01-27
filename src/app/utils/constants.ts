export type PaymentMethod = "stripe" | "paytrail"; // Add more methods as needed

// ============================================
// TEMPLATE CONFIGURATION
// ============================================

// SEO Control - Set to false to disable search engine indexing (for template/development)
// Set to true when deploying a production store
export const SEO_ENABLED = false;

// ============================================
// HOMEPAGE CONTENT
// These are shown as highlighted 3 categories on the homepage
// Used in CategorySection.tsx - customize for your store
// ============================================
export const SHOWCASE_CATEGORIES = [
  {
    title: "Pyörät",
    description: "tarvitsetko pyörän? täältä löydät kaupunkiin tai maastoon",
    image: "/pyörä1.jpg",
    link: "/products/kaulakorut",
  },
  {
    title: "Kengät",
    description:
      "Kenkävalikoimastani löydät varmasti mieleisesi kengät jokaiseen tilaisuuteen",
    image: "/lenkkarit.jpg",
    link: "/products/korvakorut",
  },
  {
    title: "Hajusteet",
    description:
      "Hajusteet ovat tärkeä osa pukeutumista ja tyyliä täältä löydät omasi",
    image: "/tuoksu.jpg",
    link: "/products/rannekorut",
  },
];
