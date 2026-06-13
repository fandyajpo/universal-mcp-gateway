export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  children?: NavItem[];
}

export const navigationTree: NavItem[] = [
  {
    title: "Getting Started",
    href: "/docs/getting-started",
    children: [
      { title: "Introduction", href: "/docs/getting-started/introduction" },
      { title: "Quick Start", href: "/docs/getting-started/quick-start" },
      { title: "Configuration", href: "/docs/getting-started/configuration" },
    ],
  },
  {
    title: "Architecture",
    href: "/docs/architecture",
    children: [
      { title: "System Design", href: "/docs/architecture/system-design" },
      { title: "Data Flow", href: "/docs/architecture/data-flow" },
      { title: "Security", href: "/docs/architecture/security" },
    ],
  },
  {
    title: "API Reference",
    href: "/docs/api",
    children: [
      { title: "Authentication", href: "/docs/api/authentication" },
      { title: "Endpoints", href: "/docs/api/endpoints" },
      { title: "Webhooks", href: "/docs/api/webhooks" },
    ],
  },
  {
    title: "Connectors",
    href: "/docs/connectors",
    children: [
      { title: "Overview", href: "/docs/connectors/overview" },
      { title: "Slack", href: "/docs/connectors/slack" },
      { title: "Notion", href: "/docs/connectors/notion" },
      { title: "GitHub", href: "/docs/connectors/github" },
    ],
  },
  {
    title: "Deployment",
    href: "/docs/deployment",
    children: [
      { title: "Self-Hosted", href: "/docs/deployment/self-hosted" },
      { title: "Cloud", href: "/docs/deployment/cloud" },
      { title: "Environment", href: "/docs/deployment/environment" },
    ],
  },
  {
    title: "Contributing",
    href: "/docs/contributing",
    children: [
      { title: "Development", href: "/docs/contributing/development" },
      { title: "Testing", href: "/docs/contributing/testing" },
      { title: "Documentation", href: "/docs/contributing/documentation" },
    ],
  },
];

export function findActiveNavItem(
  items: NavItem[],
  pathname: string,
): NavItem | undefined {
  for (const item of items) {
    if (pathname === item.href || pathname.startsWith(item.href + "/")) {
      return item;
    }
    if (item.children) {
      const found = findActiveNavItem(item.children, pathname);
      if (found) return found;
    }
  }
  return undefined;
}
