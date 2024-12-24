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
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f5f5f4;">
    <div style="background: linear-gradient(135deg, #78716c 0%, #57534e 100%); padding: 3px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #fafaf9; border-radius: 10px; padding: 32px;">
        <!-- AnyWeds Logo/Header -->
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: #44403c; font-size: 36px; margin: 0; font-weight: bold; letter-spacing: 0.5px;">
            AnyWeds
          </h1>
          <p style="color: #78716c; font-size: 16px; margin: 8px 0 0 0; font-style: italic;">
            Your Wedding, Your Way
          </p>
        </div>
        
        <div style="background: linear-gradient(to right, #78716c, #a8a29e); height: 2px; width: 50px; margin: 0 auto 20px;"></div>
        
        <h2 style="color: #44403c; font-size: 24px; font-weight: 600; margin: 0 0 24px 0; text-align: center;">
          New Inquiry for ${businessName}
        </h2>
        
        <p style="font-size: 16px; color: #57534e; margin: 0 0 24px 0; line-height: 1.6;">
          You've received a new inquiry through AnyWeds for <strong style="color: #44403c;">${businessName}</strong>. Below you will find the necessary details regarding the inquiry.
        </p>

        <div style="background-color: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #44403c; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
            Contact Information
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #78716c; width: 140px;">Name</td>
              <td style="padding: 8px 0; color: #44403c; font-weight: 500;">${
                formData.firstName
              } ${formData.lastName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #78716c;">Email</td>
              <td style="padding: 8px 0; color: #44403c; font-weight: 500;">${
                formData.email
              }</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #78716c;">Phone</td>
              <td style="padding: 8px 0; color: #44403c; font-weight: 500;">${
                formData.phone
              }</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #78716c;">Event Date</td>
              <td style="padding: 8px 0; color: #44403c; font-weight: 500;">${
                formData.eventDate
              }</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 8px; padding: 24px;">
          <h2 style="color: #44403c; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
            Message
          </h2>
          <p style="color: #44403c; margin: 0; line-height: 1.6;">
            ${formData.message.replace(/\n/g, "<br>")}
          </p>
        </div>

        <p style="font-size: 14px; color: #78716c; margin: 24px 0 0 0; text-align: center;">
          You can reply directly to this email to contact the client.
        </p>

        <!-- Footer -->
        <div style="margin-top: 35px; padding-top: 25px; border-top: 1px solid #e7e5e4; text-align: center;">
          <p style="margin: 8px 0 0 0; color: #78716c; font-size: 14px;">© 2024 AnyWeds. All rights reserved.</p>
          <div style="margin-top: 15px;">
            <a href="https://anyweds.com" 
               style="color: #57534e; text-decoration: none; font-weight: 500; border: 1px solid #d6d3d1; padding: 8px 16px; border-radius: 6px; font-size: 14px; background-color: #fafaf9;">
              www.anyweds.com
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

    // Inquirer email template
    const inquirerEmailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f5f5f4;">
      <div style="background: linear-gradient(135deg, #78716c 0%, #57534e 100%); padding: 3px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #fafaf9; border-radius: 10px; padding: 32px;">
          <!-- AnyWeds Logo/Header -->
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #44403c; font-size: 36px; margin: 0; font-weight: bold; letter-spacing: 0.5px;">
              AnyWeds
            </h1>
            <p style="color: #78716c; font-size: 16px; margin: 8px 0 0 0; font-style: italic;">
              Your Wedding, Your Way
            </p>
          </div>
          
          <div style="background: linear-gradient(to right, #78716c, #a8a29e); height: 2px; width: 50px; margin: 0 auto 20px;"></div>
  
          <h2 style="color: #44403c; font-size: 24px; font-weight: 600; margin: 0 0 24px 0; text-align: center;">
            Thank You for Your Inquiry
          </h2>
          
          <p style="font-size: 16px; color: #57534e; margin: 0 0 24px 0; line-height: 1.6;">
            Dear ${formData.firstName},
          </p>
          
          <p style="font-size: 16px; color: #57534e; margin: 0 0 24px 0; line-height: 1.6;">
            Thank you for using AnyWeds to connect with <strong style="color: #44403c;">${businessName}</strong>. The business owner will review your request and get in touch with you soon.
          </p>
          
          <div style="background-color: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <h2 style="color: #44403c; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
              Your Details
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #78716c; width: 140px;">Event Date</td>
                <td style="padding: 8px 0; color: #44403c; font-weight: 500;">${
                  formData.eventDate
                }</td>
              </tr>
            </table>
          </div>
  
          <div style="background-color: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <h2 style="color: #44403c; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
              Your Message
            </h2>
            <p style="color: #44403c; margin: 0; line-height: 1.6;">
              ${formData.message.replace(/\n/g, "<br>")}
            </p>
          </div>
  
          <p style="font-size: 16px; color: #57534e; margin: 0 0 8px 0; line-height: 1.6;">
            Best regards,
          </p>
          <p style="font-size: 16px; color: #44403c; font-weight: 500; margin: 0;">
            The AnyWeds Team
          </p>
  
          <!-- Footer -->
          <div style="margin-top: 35px; padding-top: 25px; border-top: 1px solid #e7e5e4; text-align: center;">
            <p style="margin: 8px 0 0 0; color: #78716c; font-size: 14px;">© 2024 AnyWeds. All rights reserved.</p>
            <div style="margin-top: 15px;">
              <a href="https://anyweds.com" 
                 style="color: #57534e; text-decoration: none; font-weight: 500; border: 1px solid #d6d3d1; padding: 8px 16px; border-radius: 6px; font-size: 14px; background-color: #fafaf9;">
                www.anyweds.com
              </a>
            </div>
          </div>
        </div>
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
