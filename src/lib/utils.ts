import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  type?: "text" | "image" | "analysis";
  imageUrl?: string;
};

export type NewsItem = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  url: string;
};
