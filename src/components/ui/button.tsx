import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// shadcn/ui Button 패턴 — 최소 터치 영역 44px(default/icon), sm 은 보조 액션용
const buttonBase = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:brightness-95 active:brightness-90",
        dark: "bg-foreground text-background hover:opacity-90",
        outline: "border bg-card text-foreground hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        subtle: "bg-muted text-foreground hover:bg-border",
        glass: "bg-white/90 text-[#231d19] shadow-sm backdrop-blur hover:bg-white",
      },
      size: {
        default: "h-11 px-5",
        lg: "h-12 px-6 text-[15px]",
        sm: "h-9 px-3.5 text-xs",
        icon: "size-11",
        iconSm: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

/** cva 결과를 twMerge 로 병합해 className 덮어쓰기가 확실히 적용되게 한다 */
export const buttonVariants = (props?: Parameters<typeof buttonBase>[0]) => cn(buttonBase(props));

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonBase> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = "Button";
