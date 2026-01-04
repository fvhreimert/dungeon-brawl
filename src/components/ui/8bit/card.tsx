import * as React from "react";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { cardVariants } from "./cardVariants";
import "./styles/pixel-card.css";

/* 
  Re-exporting standard shadcn card components 
  is NOT recommended here as the structure is completely different.
  We are building a bespoke pixel-art card system.
*/

export interface BitCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  frameSrc?: string;
  overlay?: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, BitCardProps>(
  ({ className, theme, frameSrc, overlay, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "pixel-card relative box-border bg-transparent transition-transform duration-200 hover:-translate-y-1 flex justify-center items-center w-[var(--card-width,320px)] h-[var(--card-height,480px)]",
          cardVariants({ theme }),
          className
        )}
        style={{
          imageRendering: "pixelated",
          // CSS variables are handled by the theme class from cardVariants
        }}
        {...props}
      >
        {/* Layer 1: Backing & Content */}
        <div className="card-backing-layer pixel-card-backing pixel-card-backing-layer relative z-10 w-[calc(100%-58px)] h-[calc(100%-58px)] flex p-0 box-border">
          <div className="card-inner pixel-card-inner-shadow pixel-card-inner-bg relative z-20 flex-1 flex flex-col box-border">
            {children}
          </div>
        </div>

        {/* Layer 2: Frame Overlay (Top) */}
        {frameSrc && (
          <div
            className="frame-overlay absolute inset-0 z-0 pointer-events-none box-border"
            style={{
              backgroundImage: `url('${frameSrc}')`,
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              imageRendering: "pixelated",
            }}
          />
        )}

        {/* Overlay Layer */}
        {overlay}
      </div>
    );
  }
);
Card.displayName = "Card";

const CardImage = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { src: string; alt?: string }
>(({ className, src, alt, ...props }, ref) => {
  const [isLoaded, setIsLoaded] = React.useState(false);

  return (
    <div
      ref={ref}
      className={cn(
        "card-visual-well pixel-card-well-bg w-full flex justify-center items-center relative border-b-2",
        className
      )}
      style={{ aspectRatio: "1 / 1" }}
      {...props}
    >
      <img
        src={src}
        alt={alt}
        className={cn(
          "w-full h-full object-contain flex-shrink-0 transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        style={{ imageRendering: "pixelated" }}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
});
CardImage.displayName = "CardImage";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    className="title-banner pixel-card-title-banner pixel-card-outline flex-none relative z-[5] p-1 text-center my-[2px]"
  >
    <div
      ref={ref}
      className={cn(
        "card-title pixel-card-title pixel-card-text-main font-['VT323'] text-[28px] leading-none uppercase tracking-wider",
        className
      )}
      {...props}
    >
      {children}
    </div>
  </div>
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "card-description-box pixel-card-description-box pixel-card-bg-parchment pixel-card-text-dark flex-1 px-[30px] pt-[5px] pb-[35px] text-[22px] text-center leading-[1.1] flex items-center justify-center font-['VT323']",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
CardDescription.displayName = "CardDescription";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export { Card, CardImage, CardTitle, CardDescription, CardHeader, CardContent };