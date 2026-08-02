import {
  buttonCurrentClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
} from "@/lib/design-tokens";
import { SITE_DESTINATIONS } from "@/lib/site-destinations";

export type SiteToolsNavId = "market-dashboard";

type NavItem = {
  id: string;
  href: string;
  label: string;
  accent?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    id: "rent-vs-buy",
    href: SITE_DESTINATIONS.rentVsBuy,
    label: "Rent vs Buy",
  },
  {
    id: "real-estate-investment",
    href: SITE_DESTINATIONS.realEstateInvestment,
    label: "Real Estate Investment Model",
  },
  {
    id: "market-dashboard",
    href: "/",
    label: "Market Dashboard",
  },
  {
    id: "get-in-touch",
    href: SITE_DESTINATIONS.getInTouch,
    label: "Get in Touch",
    accent: true,
  },
];

type SiteToolsNavProps = {
  active?: SiteToolsNavId;
  className?: string;
};

/**
 * Shared Harbaugh tools navigation (calculators + dashboard + contact).
 * Desktop: one intentional four-item row. Narrow: deliberate 2×2 grid.
 * All four destinations use ordinary same-window navigation.
 */
export function SiteToolsNav({
  active = "market-dashboard",
  className,
}: SiteToolsNavProps) {
  return (
    <nav
      aria-label="Harbaugh tools"
      className={["w-full", className].filter(Boolean).join(" ")}
    >
      <ul className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === active;
          const classes = [
            isActive
              ? buttonCurrentClass
              : item.accent
                ? buttonPrimaryClass
                : buttonSecondaryClass,
            "min-h-10 w-full whitespace-normal text-balance text-center",
          ].join(" ");

          return (
            <li key={item.id} className="flex min-w-0">
              <a
                href={item.href}
                className={`${classes} h-full`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
