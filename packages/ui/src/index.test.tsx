import { render, screen } from "@testing-library/react";

import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import { Badge } from "./badge";
import { Button } from "./button";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "./card";
import { Input } from "./input";
import { Separator } from "./separator";
import { Skeleton } from "./skeleton";
import { cn, focusRing } from "./utils";

// ── Utils ──────────────────────────────────────────

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles conditional classes", () => {
    const falsy = false;
    expect(cn("base", falsy, "visible")).toBe("base visible");
  });
});

describe("focusRing", () => {
  it("returns focus ring classes", () => {
    const classes = focusRing();
    expect(classes).toContain("focus-visible:ring-2");
    expect(classes).toContain("focus-visible:ring-ring");
  });
});

// ── Button ─────────────────────────────────────────

describe("Button", () => {
  it("renders with default variant", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeDefined();
    expect(button.className).toContain("bg-primary");
  });

  it("renders with variant classes", () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole("button", { name: /delete/i });
    expect(button.className).toContain("bg-destructive");
  });

  it("renders with size classes", () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole("button", { name: /large/i });
    expect(button.className).toContain("h-11");
  });

  it("fires click handler", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("shows spinner and disables when loading", () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole("button");
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.querySelector("svg")).toBeDefined();
  });

  it("is disabled when disabled prop is set", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button");
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it.skip("renders as child using Slot", () => {
    render(
      <Button asChild>
        <span>Link Button</span>
      </Button>,
    );
    expect(screen.getByText("Link Button").tagName).toBe("SPAN");
  });
});

// ── Card ───────────────────────────────────────────

describe("Card", () => {
  it("renders card with content", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );
    expect(screen.getByText("Title")).toBeDefined();
    expect(screen.getByText("Description")).toBeDefined();
    expect(screen.getByText("Content")).toBeDefined();
    expect(screen.getByText("Footer")).toBeDefined();
  });
});

// ── Input ──────────────────────────────────────────

describe("Input", () => {
  it("renders with default variant", () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeDefined();
    expect(input.className).toContain("border-input");
  });

  it("renders with error variant", () => {
    render(<Input inputVariant="error" placeholder="Error" />);
    const input = screen.getByPlaceholderText("Error");
    expect(input.className).toContain("border-destructive");
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("renders with icon", () => {
    render(<Input icon={<span data-testid="icon">@</span>} placeholder="With icon" />);
    expect(screen.getByTestId("icon")).toBeDefined();
  });

  it("fires onChange", async () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} placeholder="type here" />);
    await userEvent.type(screen.getByPlaceholderText("type here"), "a");
    expect(handleChange).toHaveBeenCalled();
  });
});

// ── Badge ──────────────────────────────────────────

describe("Badge", () => {
  it("renders with default variant", () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText("Default");
    expect(badge.className).toContain("bg-primary");
  });

  it("renders all variants", () => {
    const variants = ["default", "secondary", "destructive", "outline", "success", "warning"] as const;
    for (const variant of variants) {
      const { unmount } = render(<Badge variant={variant}>{variant}</Badge>);
      expect(screen.getByText(variant)).toBeDefined();
      unmount();
    }
  });
});

// ── Skeleton ───────────────────────────────────────

describe("Skeleton", () => {
  it("renders with text variant by default", () => {
    render(<Skeleton data-testid="skeleton" />);
    const el = screen.getByTestId("skeleton");
    expect(el.className).toContain("animate-pulse");
    expect(el.className).toContain("rounded");
  });

  it("renders circular variant", () => {
    render(<Skeleton variant="circular" data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton").className).toContain("rounded-full");
  });

  it("renders rectangular variant", () => {
    render(<Skeleton variant="rectangular" data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton").className).toContain("rounded-md");
  });
});

// ── Separator ──────────────────────────────────────

describe("Separator", () => {
  it("renders horizontal by default", () => {
    render(<Separator data-testid="sep" />);
    const el = screen.getByTestId("sep");
    expect(el.className).toContain("h-[1px]");
    expect(el.className).toContain("w-full");
  });

  it("renders vertical", () => {
    render(<Separator orientation="vertical" data-testid="sep" />);
    const el = screen.getByTestId("sep");
    expect(el.className).toContain("h-full");
    expect(el.className).toContain("w-[1px]");
  });

  it("is decorative by default", () => {
    render(<Separator data-testid="sep" />);
    expect(screen.getByTestId("sep").getAttribute("aria-orientation")).toBeNull();
  });
});
