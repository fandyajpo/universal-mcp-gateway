export const WORKSPACES = [
  {
    id: "seed-ws-acme",
    name: "Acme Corp",
    slug: "acme-corp",
    description: "The primary workspace for Acme Corporation — a fictional conglomerate.",
    plan: "enterprise",
    members: [
      { userId: "seed-user-admin", role: "owner" },
      { userId: "seed-user-1", role: "admin" },
      { userId: "seed-user-2", role: "member" },
      { userId: "seed-user-viewer", role: "viewer" },
    ],
    settings: {
      allowGuestAccess: false,
      maxMembers: 50,
      defaultRole: "member",
    },
  },
  {
    id: "seed-ws-starter",
    name: "Starter Workspace",
    slug: "starter",
    description: "A personal starter workspace for development and testing.",
    plan: "free",
    members: [
      { userId: "seed-user-admin", role: "owner" },
    ],
    settings: {
      allowGuestAccess: true,
      maxMembers: 5,
      defaultRole: "member",
    },
  },
];
