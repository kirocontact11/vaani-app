import type { Metadata } from "next";
import { resolveTopicSlug } from "@/lib/content/chat";
import TalkChat, { type InitialChatState } from "@/components/TalkChat";

export const metadata: Metadata = {
  title: "Speak to Vaani — KIRO",
  description: "A free, anonymous chat for parents worried about their child online.",
};

export default async function TalkPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const seg = slug?.[0];

  let initial: InitialChatState = {};
  if (seg === "voice") {
    initial = { mode: "anon", phase: "topics", mic: "ask" };
  } else if (seg) {
    const topic = resolveTopicSlug(seg);
    if (topic) initial = { mode: "anon", phase: "topics", topic };
  }

  return <TalkChat initial={initial} />;
}
