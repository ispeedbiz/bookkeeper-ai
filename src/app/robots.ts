import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bookkeeperai.ca";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/about", "/contact"],
        disallow: ["/dashboard/", "/admin/", "/cpa/", "/api/", "/login", "/get-started"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
