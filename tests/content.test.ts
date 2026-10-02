// Site content data: videos and topics. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { VIDEOS, FEATURED_VIDEOS, durationToISO8601 } from "../lib/content/videos.ts";
import { TOPICS } from "../lib/content/topics.ts";

test("every video has a unique ID, and its link and thumbnail use that ID", () => {
  assert.equal(new Set(VIDEOS.map((v) => v.id)).size, VIDEOS.length);
  for (const v of VIDEOS) {
    assert.ok(v.url.includes(v.id), `${v.id} url`);
    assert.ok(v.thumb.includes(`/vi/${v.id}/`), `${v.id} thumbnail`);
  }
});

test("every video duration converts to valid ISO 8601 for search engines", () => {
  assert.equal(durationToISO8601("3:08"), "PT3M8S");
  assert.equal(durationToISO8601("1:05"), "PT1M5S");
  for (const v of VIDEOS) {
    assert.match(v.dur, /^\d{1,2}:[0-5]\d$/, `${v.id} dur "${v.dur}"`);
    assert.match(durationToISO8601(v.dur), /^PT\d+M\d+S$/);
  }
});

test("the video page's age filters each match at least one video", () => {
  for (const grp of ["parents", "6", "10", "14"]) assert.ok(VIDEOS.some((v) => v.grp === grp), grp);
  assert.equal(FEATURED_VIDEOS.length, 3, "home carousel shows three");
});

test("topics have unique slugs and every section filled in", () => {
  assert.equal(new Set(TOPICS.map((t) => t.slug)).size, TOPICS.length);
  for (const t of TOPICS) {
    assert.match(t.slug, /^[a-z-]+$/, t.slug);
    assert.ok(t.what.length > 90, `${t.slug}: summary long enough for the topic card`);
    assert.ok(t.looksLike.length >= 3 && t.tonight.length >= 3 && t.law.length > 0, t.slug);
  }
});

test("grooming and sextortion pages use the urgent call-to-action", () => {
  for (const slug of ["grooming", "sextortion"]) assert.equal(TOPICS.find((t) => t.slug === slug)?.cta, "urgent", slug);
});
