import { NavbarLinks } from "./NavbarLinks";
import Cart from "../Cart/Cart";
import MobileLinks from "./MobileLinks";
import type { Campaign, Category, NavPage } from "@putiikkipalvelu/storefront-sdk";
import CustomerDropdown from "./CustomerDropdown";
import { getUser } from "@/lib/actions/authActions";
import { storefront } from "@/lib/storefront";

const getNavbarData = async (): Promise<{
  categories: Category[];
}> => {
  try {
    const categories = await storefront.categories.list();
    return { categories };
  } catch (error) {
    console.error("Error fetching navbar data:", error);
    return { categories: [] };
  }
};

const Navbar = async ({ campaigns, logoUrl, navPages }: { campaigns: Campaign[]; logoUrl: string; navPages: NavPage[] }) => {
  const { categories } = await getNavbarData();
  const { user } = await getUser();

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:mr-4">
        <MobileLinks categories={categories} logoUrl={logoUrl} navPages={navPages} />
      </div>

      {/* Desktop navigation links */}
      <NavbarLinks categories={categories} navPages={navPages} />

      {/* User dropdown and Cart - positioned on the right */}
      <div className="flex items-center gap-4 ml-auto">
        <CustomerDropdown user={user} />
        <Cart campaigns={campaigns} />
      </div>
    </>
  );
};

export default Navbar;
