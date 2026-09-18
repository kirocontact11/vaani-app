import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { TOPICS } from "@/lib/content/topics";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/videos",
    "/topics",
    "/community",
    "/register",
    "/book",
    "/talk",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));

  const topicRoutes = TOPICS.map((t) => ({
    url: `${SITE_URL}/topics/${t.slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...topicRoutes];
}
