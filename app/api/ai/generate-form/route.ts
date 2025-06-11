import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { formType, description, userId, role } = await request.json()

    // Check if user is admin
    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Generate form based on type and description
    const generatedForm = generateFormTemplate(formType, description)

    return NextResponse.json(generatedForm)
  } catch (error) {
    console.error("Form generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateFormTemplate(formType: string, description: string) {
  // Base form structure
  const form = {
    name: `AI Generated ${formType}`,
    description: description || `Auto-generated ${formType.toLowerCase()} form`,
    fields: [],
    createdAt: new Date().toISOString(),
    id: `ai_${Date.now()}`,
  }

  // Add fields based on form type
  switch (formType) {
    case "Customer Feedback":
      form.fields = [
        {
          id: `field_${Date.now()}_1`,
          type: "text",
          label: "Full Name",
          placeholder: "Enter your full name",
          required: true,
          readonly: false,
          hidden: false,
          desktop: {
            position: { x: 50, y: 50 },
            size: { width: 300, height: 60 },
          },
          mobile: {
            position: { x: 20, y: 50 },
            size: { width: 280, height: 50 },
          },
        },
        {
          id: `field_${Date.now()}_2`,
          type: "text",
          label: "Email Address",
          placeholder: "Enter your email address",
          required: true,
          readonly: false,
          hidden: false,
          desktop: {
            position: { x: 50, y: 130 },
            size: { width: 300, height: 60 },
          },
          mobile: {
            position: { x: 20, y: 120 },
            size: { width: 280, height: 50 },
          },
        },
        {
          id: `field_${Date.now()}_3`,
          type: "dropdown",
          label: "How would you rate our service?",
          options: ["Excellent", "Good", "Fair", "Poor"],
          required: true,
          readonly: false,
          hidden: false,
          desktop: {
            position: { x: 50, y: 210 },
            size: { width: 300, height: 60 },
          },
          mobile: {
            position: { x: 20, y: 190 },
            size: { width: 280, height: 50 },
          },
        },
        {
          id: `field_${Date.now()}_4`,
          type: "text",
          label: "Comments",
          placeholder: "Please share your feedback",
          required: false,
          readonly: false,
          hidden: false,
          desktop: {
            position: { x: 50, y: 290 },
            size: { width: 400, height: 120 },
          },
          mobile: {
            position: { x: 20, y: 260 },
            size: { width: 280, height: 100 },
          },
        },
      ]
      break

    case "Event Registration":
      form.fields = [
        {
          id: `field_${Date.now()}_1`,
          type: "text",
          label: "Attendee Name",
          placeholder: "Enter your full name",
          required: true,
          readonly: false,
          hidden: false,
          desktop: {
            position: { x: 50, y: 50 },
            size: { width: 300, height: 60 },
          },
          mobile: {
            position: { x: 20, y: 50 },
            size: { width: 280, height: 50 },
          },
        },
        {
          id: `field_${Date.now()}_2`,
          type: "text",
          label: "Email Address",
          placeholder: "Enter your email address",
          required: true,
          readonly: false,
          hidden: false,
          desktop: {
            position: { x: 50, y: 130 },
            size: { width: 300, height: 60 },
          },
          mobile: {
            position: { x: 20, y: 120 },
            size: { width: 280, height: 50 },
          },
        },
        {
          id: `field_${Date.now()}_3`,
          type: "date",
          label: "Attendance Date",
          required: true,
          readonly: false,
          hidden: false,
          desktop: {
            position: { x: 50, y: 210 },
            size: { width: 300, height: 60 },
          },
          mobile: {
            position: { x: 20, y: 190 },
            size: { width: 280, height: 50 },
          },
        },
        {
          id: `field_${Date.now()}_4`,
          type: "dropdown",
          label: "Ticket Type",
          options: ["Standard", "VIP", "Group", "Student"],
          required: true,
          readonly: false,
          hidden: false,
          desktop: {
            position: { x: 50, y: 290 },
            size: { width: 300, height: 60 },
          },
          mobile: {
            position: { x: 20, y: 260 },
            size: { width: 280, height: 50 },
          },
        },
      ]
      break

    case "Research Survey":
      form.fields = [
        {
          id: `field_${Date.now()}_1`,
          type: "dropdown",
          label: "Age Group",
          options: ["18-24", "25-34", "35-44", "45-54", "55+"],
          required: true,
          readonly: false,
          hidden: false,
          desktop: {
            position: { x: 50, y: 50 },
            size: { width: 300, height: 60 },
          },
          mobile: {
            position: { x: 20, y: 50 },
            size: { width: 280, height: 50 },
          },
        },
        {
          id: `field_${Date.now()}_2`,
          type: "dropdown",
          label: "How often do you use our product?",
          options: ["Daily", "Weekly", "Monthly", "Rarely", "Never"],
          required: true,
          readonly: false,
          hidden: false,
          desktop: {
            position: { x: 50, y: 130 },
            size: { width: 300, height: 60 },
          },
          mobile: {
            position: { x: 20, y: 120 },
            size: { width: 280, height: 50 },
          },
        },
        {
          id: `field_${Date.now()}_3`,
          type: "dropdown",
          label: "Satisfaction Level",
          options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"],
          required: true,
          readonly: false,
          hidden: false,
          desktop: {
            position: { x: 50, y: 210 },
            size: { width: 300, height: 60 },
          },
          mobile: {
            position: { x: 20, y: 190 },
            size: { width: 280, height: 50 },
          },
        },
        {
          id: `field_${Date.now()}_4`,
          type: "text",
          label: "What improvements would you suggest?",
          placeholder: "Please share your thoughts",
          required: false,
          readonly: false,
          hidden: false,
          desktop: {
            position: { x: 50, y: 290 },
            size: { width: 400, height: 120 },
          },
          mobile: {
            position: { x: 20, y: 260 },
            size: { width: 280, height: 100 },
          },
        },
      ]
      break

    case "Contact Form":
      form.fields = [
        {
          id: `field_${Date.now()}_1`,
          type: "text",
          label: "Name",
          placeholder: "Enter your name",
          required: true,
          readonly: false,
          hidden: false,
          desktop: {
            position: { x: 50, y: 50 },
            size: { width: 300, height: 60 },
          },
          mobile: {
            position: { x: 20, y: 50 },
            size: { width: 280, height: 50 },
          },
        },
        {
          id: `field_${Date.now()}_2`,
          type: "text",
          label: "Email",
          placeholder: "Enter your email address",
          required: true,
          readonly: false,
          hidden: false,
          desktop: {
            position: { x: 50, y: 130 },
            size: { width: 300, height: 60 },
          },
          mobile: {
            position: { x: 20, y: 120 },
            size: { width: 280, height: 50 },
          },
        },
        {
          id: `field_${Date.now()}_3`,
          type: "dropdown",
          label: "Subject",
          options: ["General Inquiry", "Support", "Feedback", "Other"],
          required: true,
          readonly: false,
          hidden: false,
          desktop: {
            position: { x: 50, y: 210 },
            size: { width: 300, height: 60 },
          },
          mobile: {
            position: { x: 20, y: 190 },
            size: { width: 280, height: 50 },
          },
        },
        {
          id: `field_${Date.now()}_4`,
          type: "text",
          label: "Message",
          placeholder: "Enter your message",
          required: true,
          readonly: false,
          hidden: false,
          desktop: {
            position: { x: 50, y: 290 },
            size: { width: 400, height: 120 },
          },
          mobile: {
            position: { x: 20, y: 260 },
            size: { width: 280, height: 100 },
          },
        },
      ]
      break

    default:
      // Generic form with basic fields
      form.fields = [
        {
          id: `field_${Date.now()}_1`,
          type: "text",
          label: "Name",
          placeholder: "Enter your name",
          required: true,
          readonly: false,
          hidden: false,
          desktop: {
            position: { x: 50, y: 50 },
            size: { width: 300, height: 60 },
          },
          mobile: {
            position: { x: 20, y: 50 },
            size: { width: 280, height: 50 },
          },
        },
        {
          id: `field_${Date.now()}_2`,
          type: "text",
          label: "Email",
          placeholder: "Enter your email",
          required: true,
          readonly: false,
          hidden: false,
          desktop: {
            position: { x: 50, y: 130 },
            size: { width: 300, height: 60 },
          },
          mobile: {
            position: { x: 20, y: 120 },
            size: { width: 280, height: 50 },
          },
        },
      ]
  }

  return form
}
