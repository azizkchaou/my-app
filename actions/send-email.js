"use server";

import { Resend } from "resend";
import { render } from "@react-email/render";

export async function sendEmail({ to, subject, react }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY in environment.");
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM || "Finance App <onboarding@resend.dev>";

  try {
    // Render React component to HTML string using @react-email/render
    const html = await render(react);
    
    console.log("Rendering HTML, length:", html.length, "First 100 chars:", html.substring(0, 100));

    const data = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    console.log("Email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
}