import { cva } from "class-variance-authority";

export const cardVariants = cva("", {
  variants: {
    theme: {
      "theme-common": "theme-common",
      "theme-dungeon": "theme-dungeon",
      "theme-nature": "theme-nature",
      "theme-gold": "theme-gold",
      "theme-red": "theme-red",
      "theme-gray": "theme-gray",
      "theme-fel": "theme-fel",
      "theme-blue": "theme-blue",
      "theme-dark": "theme-dark",
    },
  },
  defaultVariants: {
    theme: "theme-common",
  },
});
