// Request validation for the two API routes, kept in one plain module so the
// exact rules production runs are the ones tests/validation.test.ts checks.
import { z } from "zod";

// Length caps keep one request from storing megabytes of text; generous
// enough that no real form entry comes near them.
const required = z.string().trim().min(1).max(200);
const optional = z.string().trim().max(200).optional().default("");
const longText = z.string().trim().max(5000).optional().default("");
const choices = z.array(z.string().max(100)).max(20).optional().default([]);

const phoneOrEmail = (v: { phone: string; email: string }) => Boolean(v.phone || v.email);

const psychSchema = z
  .object({
    kind: z.literal("psych"),
    pname: required,
    qualification: required,
    license: required,
    years: optional,
    specs: choices,
    avail: choices,
    langs: optional,
    city: required,
    phone: optional,
    email: optional,
    pconsent: z.literal(true),
  })
  .refine(phoneOrEmail, { message: "phone or email required" });

const cdcSchema = z
  .object({
    kind: z.literal("cdc"),
    centre: required,
    person: required,
    role: required,
    services: choices,
    ages: choices,
    langs: optional,
    city: required,
    area: optional,
    phone: optional,
    email: optional,
    site: optional,
    note: longText,
    consent: z.literal(true),
  })
  .refine(phoneOrEmail, { message: "phone or email required" });

const bookSchema = z.object({
  kind: z.literal("book"),
  bname: required,
  bage: required,
  bcity: required,
  bphone: required,
  blang: optional,
  bwhat: longText,
  btime: choices,
});

export const submitSchema = z.discriminatedUnion("kind", [psychSchema, cdcSchema, bookSchema]);

// Vapi's server URL receives many message types (status-update, transcript,
// speech-update, hang, end-of-call-report, ...); only these fields are read.
export const vapiMessageSchema = z.object({
  message: z.object({
    type: z.string(),
    endedReason: z.string().optional(),
    call: z.object({ id: z.string().optional() }).optional(),
    artifact: z.object({ transcript: z.string().optional() }).optional(),
  }),
});
