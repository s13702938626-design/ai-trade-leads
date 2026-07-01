import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "塑料材料行业外贸客户开发工作台",
  description: "本地可运行的真实海外客户开发工作台 v0.1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
