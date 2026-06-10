import { forwardRef, type InputHTMLAttributes } from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn, focusRing } from "./utils";

const inputVariants = cva(
  [
    "flex w-full rounded-md border bg-transparent px-3 py-2 text-sm",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
    "placeholder:text-muted-foreground",
    focusRing(),
  ].join(" "),
  {
    variants: {
      inputVariant: {
        default: "border-input",
        error: "border-destructive text-destructive",
      },
      inputSize: {
        default: "h-10",
        sm: "h-8 px-2 text-xs",
        lg: "h-12 px-4 text-base",
      },
    },
    defaultVariants: {
      inputVariant: "default",
      inputSize: "default",
    },
  },
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, inputVariant, inputSize, icon, type = "text", ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(inputVariants({ inputVariant, inputSize }), icon && "pl-10", className)}
          ref={ref}
          aria-invalid={inputVariant === "error" || undefined}
          {...props}
        />
      </div>
    );
  },
);

Input.displayName = "Input";
