import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client with the anon key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

type ServiceType = "hair-makeup" | "photo-video" | "wedding-planner" | "dj";

interface InquiryRequest {
  serviceType: ServiceType;
  serviceId: string;
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    eventDate: string;
    message: string;
  };
  businessName: string;
}

const getTableName = (serviceType: ServiceType) => {
  switch (serviceType) {
    case "hair-makeup":
      return "hair_makeup_listing";
    case "photo-video":
      return "photo_video_listing";
    case "wedding-planner":
      return "wedding_planner_listing";
    case "dj":
      return "dj_listing";
    default:
      throw new Error("Invalid service type");
  }
};

const getServiceTypeDisplay = (serviceType: ServiceType) => {
  switch (serviceType) {
    case "hair-makeup":
      return "Beauty Service";
    case "photo-video":
      return "Photography/Videography Service";
    case "wedding-planner":
      return "Wedding Planning Service";
    case "dj":
      return "DJ Service";
    default:
      return "Service";
  }
};

export async function POST(req: Request) {
  try {
    const { serviceType, serviceId, formData, businessName } =
      (await req.json()) as InquiryRequest;

    // Get service provider's email from the listing
    const { data: listingData, error: listingError } = await supabaseAdmin
      .from(getTableName(serviceType))
      .select("user_email")
      .eq("id", serviceId)
      .single();

    if (listingError || !listingData) {
      throw new Error("Could not find business contact information");
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Owner email template
    const ownerEmailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 16px; padding: 32px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin: 0 0 24px 0; text-align: center;">
            Inquiry for ${businessName}
          </h1>
          
          <p style="font-size: 16px; color: #4b5563; margin: 0 0 24px 0; line-height: 1.6;">
            You've received a new inquiry for <strong style="color: #1a1a1a;">${businessName}</strong>. Below you will find the necessary details regarding the inquiry.
          </p>

          <div style="background-color: #f3f4f6; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
              Contact Information
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 140px;">Name</td>
                <td style="padding: 8px 0; color: #1a1a1a; font-weight: 500;">${
                  formData.firstName
                } ${formData.lastName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Email</td>
                <td style="padding: 8px 0; color: #1a1a1a; font-weight: 500;">${
                  formData.email
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Phone</td>
                <td style="padding: 8px 0; color: #1a1a1a; font-weight: 500;">${
                  formData.phone
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Event Date</td>
                <td style="padding: 8px 0; color: #1a1a1a; font-weight: 500;">${
                  formData.eventDate
                }</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #f3f4f6; border-radius: 12px; padding: 24px;">
            <h2 style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
              Message
            </h2>
            <p style="color: #1a1a1a; margin: 0; line-height: 1.6;">
              ${formData.message.replace(/\n/g, "<br>")}
            </p>
          </div>

          <p style="font-size: 14px; color: #6b7280; margin: 24px 0 0 0; text-align: center;">
            You can reply directly to this email to contact the client.
          </p>
        </div>
      </div>
    `;

    // Inquirer email template
    const inquirerEmailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 16px; padding: 32px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin: 0 0 24px 0; text-align: center;">
            Thank You for Your Inquiry
          </h1>
          
          <p style="font-size: 16px; color: #4b5563; margin: 0 0 24px 0; line-height: 1.6;">
            Dear ${formData.firstName},
          </p>
          
          <p style="font-size: 16px; color: #4b5563; margin: 0 0 24px 0; line-height: 1.6;">
            We've received your inquiry for <strong style="color: #1a1a1a;">${businessName}</strong>. The business owner will review your request and get in touch with you soon.
          </p>
          
          <div style="background-color: #f3f4f6; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
              Your Details
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 140px;">Event Date</td>
                <td style="padding: 8px 0; color: #1a1a1a; font-weight: 500;">${
                  formData.eventDate
                }</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #f3f4f6; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
              Your Message
            </h2>
            <p style="color: #1a1a1a; margin: 0; line-height: 1.6;">
              ${formData.message.replace(/\n/g, "<br>")}
            </p>
          </div>

          <p style="font-size: 16px; color: #4b5563; margin: 0 0 8px 0; line-height: 1.6;">
            Best regards,
          </p>
          <p style="font-size: 16px; color: #1a1a1a; font-weight: 500; margin: 0;">
            The AnyWeds Team
          </p>
        </div>
      </div>
    `;

    // Send email to business owner
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: listingData.user_email,
      subject: `New Inquiry for ${businessName}`,
      html: ownerEmailHtml,
      replyTo: formData.email,
    });

    // Send confirmation email to inquirer
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: formData.email,
      subject: `Your Inquiry for ${businessName} - Confirmation`,
      html: inquirerEmailHtml,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Full error details:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send email",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
