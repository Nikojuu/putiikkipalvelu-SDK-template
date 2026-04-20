import { NavbarLinks } from "./NavbarLinks";
import Cart from "../Cart/Cart";
import MobileLinks from "./MobileLinks";
import type { Campaign, NavPage } from "@putiikkipalvelu/storefront-sdk";
import CustomerDropdown from "./CustomerDropdown";
import { getUser } from "@/lib/actions/authActions";
import { getCategories } from "@/lib/categories";

const Navbar = async ({ campaigns, logoUrl, navPages }: { campaigns: Campaign[]; logoUrl: string; navPages: NavPage[] }) => {
  const [categories, { user }] = await Promise.all([getCategories(), getUser()]);

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
